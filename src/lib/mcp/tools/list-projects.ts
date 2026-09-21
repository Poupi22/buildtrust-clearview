import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_projects",
  title: "List projects",
  description: "List the construction projects the signed-in user can access, with status and completion.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of projects to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to list projects.");
    const { data, error } = await supabaseForUser(ctx)
      .from("projects")
      .select("id, code, title, status, completion, location, start_date, planned_end_date, current_phase")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new ToolError(error.message);
    const projects = (data ?? []).map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      status: p.status,
      completion: p.completion,
      location: p.location,
      startDate: p.start_date,
      plannedEndDate: p.planned_end_date,
      currentPhase: p.current_phase,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(projects, null, 2) }],
      structuredContent: { projects },
    };
  },
});
