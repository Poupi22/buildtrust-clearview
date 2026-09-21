import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_project",
  title: "Get project overview",
  description: "Get one project with its milestones and progress for the signed-in user.",
  inputSchema: {
    project_id: z.string().uuid().describe("The project identifier."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ project_id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to read a project.");
    const supabase = supabaseForUser(ctx);
    const { data: project, error } = await supabase
      .from("projects")
      .select("id, code, title, status, completion, location, type, start_date, planned_end_date, current_phase, client_name, entreprise, mission_controle")
      .eq("id", project_id)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!project) throw new ToolError("Project not found or not visible to you.");

    const { data: milestoneRows, error: mErr } = await supabase
      .from("milestones")
      .select("id, title, status, progress, review_status, is_published, planned_start, planned_end, ordering")
      .eq("project_id", project_id)
      .order("ordering", { ascending: true });
    if (mErr) throw new ToolError(mErr.message);

    const result = {
      id: project.id,
      code: project.code,
      title: project.title,
      status: project.status,
      completion: project.completion,
      location: project.location,
      type: project.type,
      startDate: project.start_date,
      plannedEndDate: project.planned_end_date,
      currentPhase: project.current_phase,
      clientName: project.client_name,
      entreprise: project.entreprise,
      missionControle: project.mission_controle,
      milestones: (milestoneRows ?? []).map((m) => ({
        id: m.id,
        title: m.title,
        status: m.status,
        progress: m.progress,
        reviewStatus: m.review_status,
        isPublished: m.is_published,
        plannedStart: m.planned_start,
        plannedEnd: m.planned_end,
        ordering: m.ordering,
      })),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: { project: result },
    };
  },
});
