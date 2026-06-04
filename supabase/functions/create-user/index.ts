// Admin-only: create any user with a chosen app_role, optionally add them
// to a project. Returns generated credentials.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_ROLES = ["super-admin", "company-admin", "engineer", "technician", "client"] as const;
const PROJECT_ROLES = ["manager", "engineer", "technician", "client", "viewer"] as const;

function makePassword(len = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const { email, full_name, role, project_id, project_role, password: customPwd } = body ?? {};
    if (!email || !role) {
      return new Response(JSON.stringify({ error: "email and role are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!APP_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Invalid role. Allowed: ${APP_ROLES.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (project_id && project_role && !PROJECT_ROLES.includes(project_role)) {
      return new Response(JSON.stringify({ error: `Invalid project_role` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Only super-admin / company-admin can create users
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = (roles ?? []).some((r: any) =>
      r.role === "company-admin" || r.role === "super-admin"
    );
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Only admins can create users" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const password = (customPwd && String(customPwd).length >= 8) ? String(customPwd) : makePassword();

    // Find or create
    let userId: string | null = null;
    let createdNew = false;
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name ?? "", role },
      });
      if (createErr || !created?.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create user" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
      createdNew = true;
    }

    // Ensure profile
    await admin.from("profiles").upsert(
      { user_id: userId!, full_name: full_name ?? "", avatar_initials: (full_name ?? email).slice(0, 2).toUpperCase() },
      { onConflict: "user_id" },
    );

    // Ensure app role (replace any existing — single role per user simplifies UI)
    const { data: existingRoles } = await admin
      .from("user_roles").select("id, role").eq("user_id", userId!);
    const hasRole = (existingRoles ?? []).some((r: any) => r.role === role);
    if (!hasRole) {
      await admin.from("user_roles").insert({ user_id: userId!, role });
    }

    // Optional project assignment
    if (project_id) {
      const pmRole = project_role ?? (role === "client" ? "client" : role === "technician" ? "technician" : "engineer");
      const { data: existingMember } = await admin
        .from("project_members").select("id")
        .eq("project_id", project_id).eq("user_id", userId!).maybeSingle();
      if (!existingMember) {
        const { error: pmErr } = await admin.from("project_members").insert({
          project_id, user_id: userId!, role: pmRole,
        });
        if (pmErr) {
          return new Response(JSON.stringify({ error: pmErr.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      created: createdNew,
      user_id: userId,
      email: normalizedEmail,
      password: createdNew ? password : null,
      role,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
