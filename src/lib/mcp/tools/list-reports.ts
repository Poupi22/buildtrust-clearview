import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_reports",
  title: "List site reports",
  description: "List daily and weekly site journal reports for a project, with their workflow state.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project identifier."),
    report_type: z.enum(["daily", "weekly", "all"]).default("all").describe("Filter by journal type."),
    limit: z.number().int().min(1).max(100).default(20).describe("Maximum number of reports to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, report_type, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to list reports.");
    let query = supabaseForUser(ctx)
      .from("daily_reports")
      .select("id, report_ref, report_type, report_date, week_start, week_end, state, status, is_published, is_late, title, summary")
      .eq("project_id", project_id)
      .order("report_date", { ascending: false })
      .limit(limit);
    if (report_type !== "all") query = query.eq("report_type", report_type);
    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    const reports = (data ?? []).map((r) => ({
      id: r.id,
      ref: r.report_ref,
      type: r.report_type,
      date: r.report_date,
      weekStart: r.week_start,
      weekEnd: r.week_end,
      state: r.state,
      status: r.status,
      isPublished: r.is_published,
      isLate: r.is_late,
      title: r.title,
      summary: r.summary,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(reports, null, 2) }],
      structuredContent: { reports },
    };
  },
});
