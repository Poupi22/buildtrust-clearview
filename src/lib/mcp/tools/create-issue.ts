import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_issue",
  title: "Create site issue",
  description: "Raise a new issue on a project as the signed-in user. The issue starts unpublished and open.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project identifier."),
    title: z.string().trim().min(1).max(200).describe("Short issue title."),
    description: z.string().trim().max(4000).optional().describe("Detailed description of the issue."),
    impact: z.string().trim().max(2000).optional().describe("Impact on cost, schedule or quality."),
    severity: z.enum(["low", "medium", "high", "critical"]).default("medium").describe("Issue severity."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ project_id, title, description, impact, severity }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to create an issue.");
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Could not determine the signed-in user.");
    const { data, error } = await supabaseForUser(ctx)
      .from("report_issues")
      .insert({
        project_id,
        title,
        description: description ?? null,
        impact: impact ?? null,
        severity: severity as never,
        created_by: userId,
      })
      .select("id, title, severity, status, date_identified")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("The issue could not be created.");
    const issue = {
      id: data.id,
      title: data.title,
      severity: data.severity,
      status: data.status,
      dateIdentified: data.date_identified,
    };
    return {
      content: [{ type: "text", text: `Created issue "${issue.title}" (${issue.severity}).` }],
      structuredContent: { issue },
    };
  },
});
