import { createOpenAI } from "npm:@ai-sdk/openai";
import { convertToModelMessages, streamText } from "npm:ai";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  getLovableAiGatewayResponseHeaders,
  withLovableAiGatewayRunIdHeader,
} from "../_shared/ai-gateway.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonError(405, "Method not allowed");

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) return jsonError(500, "AI is not configured for this app yet.");

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError(401, "You must be signed in to use the assistant.");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  // Client runs as the signed-in user: RLS decides what the assistant can see.
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return jsonError(401, "Your session has expired. Please sign in again.");

  let body: { messages?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid request body.");
  }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  if (messages.length === 0) return jsonError(400, "No messages provided.");

  // Live, permission-scoped snapshot of the caller's BuildTrust data.
  const [profile, projects, milestones, reports, issues, tasks] = await Promise.all([
    supabase.from("profiles").select("full_name, company").eq("user_id", user.id).maybeSingle(),
    supabase.from("projects")
      .select("title, code, status, completion, current_phase, client_name, location, start_date, planned_end_date")
      .order("created_at", { ascending: false }).limit(20),
    supabase.from("milestones")
      .select("title, status, review_status, progress, planned_end, is_published, project_id")
      .order("planned_end", { ascending: true }).limit(30),
    supabase.from("daily_reports")
      .select("report_type, report_date, week_start, week_end, state, status, weather, workforce_count, work_area, is_published, project_id")
      .order("report_date", { ascending: false }).limit(20),
    supabase.from("report_issues")
      .select("title, severity, status, date_identified, project_id")
      .order("created_at", { ascending: false }).limit(20),
    supabase.from("tasks")
      .select("title, status, priority, due_date, project_id")
      .order("due_date", { ascending: true }).limit(20),
  ]);

  const snapshot = {
    viewer: {
      name: profile.data?.full_name ?? null,
      company: profile.data?.company ?? null,
    },
    projects: projects.data ?? [],
    milestones: milestones.data ?? [],
    reports: reports.data ?? [],
    issues: issues.data ?? [],
    tasks: tasks.data ?? [],
  };

  const system = `You are the BuildTrust assistant, embedded in the BuildTrust construction transparency platform.
You answer questions about the signed-in user's projects, milestones, daily and weekly site journals (reports), site issues, and tasks.

Rules:
- Answer in the same language the user writes in (the app is bilingual French/English).
- Use ONLY the data snapshot below and the conversation history. Never invent figures, dates, or statuses.
- If the answer is not in the snapshot, say so clearly and suggest where in the app the user can find it.
- You are read-only: you cannot create, edit, approve, or publish anything. Explain which screen to use instead.
- Be concise and concrete. Quote statuses, completion percentages and dates exactly as given.
- Report states: draft → submitted → under-review → approved → published (published/approved content is what clients see). Daily journals are internal; weekly journals may be published to the client portal.
- Format answers in markdown: short paragraphs, bullet lists, bold key figures.

Data snapshot (JSON, permission-scoped to this user, fresh for every message):
${JSON.stringify(snapshot)}`;

  const initialRunId = getLovableAiGatewayRunId(req);
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
  const lovable = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: lovableKey, // satisfies the SDK; the gateway authenticates on the header below
    headers: { "Lovable-API-Key": lovableKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: lovable.responses("openai/gpt-6-astra"),
    system,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    providerOptions: {
      openai: {
        store: false,
        include: ["reasoning.encrypted_content"],
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
      },
    },
  });

  const response = result.toUIMessageStreamResponse({
    sendReasoning: true,
    headers: getLovableAiGatewayResponseHeaders(undefined, {
      ...corsHeaders,
      ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
    }),
  });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch, corsHeaders);
});
