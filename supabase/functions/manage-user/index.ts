import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const callerId = claims.claims.sub as string;

    const admin = createClient(url, service);

    // Check admin
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", callerId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "super-admin" || r.role === "company-admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { action, user_id, role, full_name, is_active, project_assignments } = body ?? {};

    if (!action || !user_id) {
      return new Response(JSON.stringify({ error: "Missing action or user_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (user_id === callerId && (action === "deactivate" || action === "delete")) {
      return new Response(JSON.stringify({ error: "You cannot deactivate or delete your own account" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const allowedRoles = ["super-admin", "company-admin", "engineer", "technician", "client"];

    switch (action) {
      case "update_profile": {
        const patch: Record<string, unknown> = {};
        if (typeof full_name === "string") {
          patch.full_name = full_name;
          patch.avatar_initials = full_name.trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "U";
        }
        if (Object.keys(patch).length > 0) {
          const { error } = await admin.from("profiles").update(patch).eq("user_id", user_id);
          if (error) throw error;
        }
        break;
      }
      case "update_role": {
        if (!allowedRoles.includes(role)) {
          return new Response(JSON.stringify({ error: "Invalid role" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await admin.from("user_roles").delete().eq("user_id", user_id);
        const { error } = await admin.from("user_roles").insert({ user_id, role });
        if (error) throw error;
        break;
      }
      case "deactivate": {
        const { error: pErr } = await admin.from("profiles").update({ is_active: false }).eq("user_id", user_id);
        if (pErr) throw pErr;
        // Ban via auth admin (876000h = 100 years)
        const { error: aErr } = await admin.auth.admin.updateUserById(user_id, { ban_duration: "876000h" } as any);
        if (aErr) throw aErr;
        break;
      }
      case "reactivate": {
        const { error: pErr } = await admin.from("profiles").update({ is_active: true }).eq("user_id", user_id);
        if (pErr) throw pErr;
        const { error: aErr } = await admin.auth.admin.updateUserById(user_id, { ban_duration: "none" } as any);
        if (aErr) throw aErr;
        break;
      }
      case "set_project_assignments": {
        // project_assignments: [{ project_id, role }]
        if (!Array.isArray(project_assignments)) {
          return new Response(JSON.stringify({ error: "project_assignments must be an array" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        await admin.from("project_members").delete().eq("user_id", user_id);
        if (project_assignments.length > 0) {
          const rows = project_assignments.map((a: any) => ({
            user_id,
            project_id: a.project_id,
            role: a.role ?? "engineer",
          }));
          const { error } = await admin.from("project_members").insert(rows);
          if (error) throw error;
        }
        break;
      }
      case "reset_password": {
        const newPassword = crypto.randomUUID().replace(/-/g, "").slice(0, 14) + "!A1";
        const { error } = await admin.auth.admin.updateUserById(user_id, { password: newPassword });
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, password: newPassword }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
