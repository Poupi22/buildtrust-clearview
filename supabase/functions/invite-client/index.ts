// Invite a client to a project: creates an auth user (auto-confirmed),
// assigns the 'client' app role and adds them to project_members as client.
// Returns the temp credentials to the caller (admin/manager).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function makePassword(len = 14) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%";
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

    // Caller-scoped client (to identify the requester)
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
    const { project_id, email, full_name, password: customPwd } = body ?? {};
    if (!project_id || !email) {
      return new Response(JSON.stringify({ error: "project_id and email are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client (service role) — bypasses RLS
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Authorize caller: must be company-admin / super-admin, OR manager on this project
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = (roles ?? []).some((r: any) =>
      r.role === "company-admin" || r.role === "super-admin"
    );

    let isManager = false;
    if (!isAdmin) {
      const { data: membership } = await admin
        .from("project_members").select("role")
        .eq("project_id", project_id).eq("user_id", callerId).maybeSingle();
      isManager = membership?.role === "manager";
    }
    if (!isAdmin && !isManager) {
      return new Response(JSON.stringify({ error: "Only project admins or managers can invite clients" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const password = (customPwd && String(customPwd).length >= 8) ? String(customPwd) : makePassword();

    // Find or create the auth user
    let userId: string | null = null;
    let createdNew = false;

    // Try to find by listing users (paginated). For dev scale this is fine.
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail);
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: full_name ?? "", role: "client" },
      });
      if (createErr || !created?.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create user" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = created.user.id;
      createdNew = true;
    }

    // Ensure profile exists (handle_new_user trigger usually does it)
    await admin.from("profiles").upsert(
      { user_id: userId!, full_name: full_name ?? "", avatar_initials: (full_name ?? "C").slice(0, 2).toUpperCase() },
      { onConflict: "user_id" },
    );

    // Ensure 'client' app role
    const { data: existingRoles } = await admin
      .from("user_roles").select("id, role").eq("user_id", userId!);
    const hasClientRole = (existingRoles ?? []).some((r: any) => r.role === "client");
    if (!hasClientRole) {
      await admin.from("user_roles").insert({ user_id: userId!, role: "client" });
    }

    // Add to project_members as client (idempotent)
    const { data: existingMember } = await admin
      .from("project_members").select("id, role")
      .eq("project_id", project_id).eq("user_id", userId!).maybeSingle();
    if (!existingMember) {
      const { error: pmErr } = await admin.from("project_members").insert({
        project_id, user_id: userId!, role: "client",
      });
      if (pmErr) {
        return new Response(JSON.stringify({ error: pmErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      created: createdNew,
      user_id: userId,
      email: normalizedEmail,
      password: createdNew ? password : null,
      message: createdNew
        ? "Client account created and added to the project."
        : "Existing user added to the project as client. Password not changed.",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
