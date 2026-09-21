import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_tasks",
  title: "List my tasks",
  description: "List the tasks assigned to the signed-in user, newest first.",
  inputSchema: {
    project_id: z.string().uuid().optional().describe("Optionally restrict to one project."),
    limit: z.number().int().min(1).max(100).default(25).describe("Maximum number of tasks to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to list your tasks.");
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Could not determine the signed-in user.");
    let query = supabaseForUser(ctx)
      .from("tasks")
      .select("id, project_id, title, description, status, priority, due_date, milestone_id, sub_milestone_id")
      .eq("assigned_to", userId)
      .order("due_date", { ascending: true })
      .limit(limit);
    if (project_id) query = query.eq("project_id", project_id);
    const { data, error } = await query;
    if (error) throw new ToolError(error.message);
    const tasks = (data ?? []).map((t) => ({
      id: t.id,
      projectId: t.project_id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      milestoneId: t.milestone_id,
      subMilestoneId: t.sub_milestone_id,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }],
      structuredContent: { tasks },
    };
  },
});
