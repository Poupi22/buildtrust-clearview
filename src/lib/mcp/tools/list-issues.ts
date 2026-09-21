import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_issues",
  title: "List site issues",
  description: "List issues raised on a project, with severity and status.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project identifier."),
    status: z.enum(["open", "in-progress", "resolved", "all"]).default("all").describe("Filter by issue status."),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of issues to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to list issues.");
    let query = supabaseForUser(ctx)
      .from("report_issues")
      .select("id, title, description, impact, severity, status, date_identified, is_published")
      .eq("project_id", project_id)
      .order("date_identified", { ascending: false })
      .limit(limit);
    if (status !== "all") query = query.eq("status", status as never);
    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    const issues = (data ?? []).map((i) => ({
      id: i.id,
      title: i.title,
      description: i.description,
      impact: i.impact,
      severity: i.severity,
      status: i.status,
      dateIdentified: i.date_identified,
      isPublished: i.is_published,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(issues, null, 2) }],
      structuredContent: { issues },
    };
  },
});
