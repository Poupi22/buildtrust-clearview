import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_report",
  title: "Get site report",
  description: "Read the full content of one daily or weekly site journal report.",
  inputSchema: {
    report_id: z.string().uuid().describe("The report identifier."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ report_id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Sign in to read a report.");
    const { data, error } = await supabaseForUser(ctx)
      .from("daily_reports")
      .select(
        "id, project_id, report_ref, report_type, report_date, week_start, week_end, state, status, is_published, is_late, title, summary, weather, work_area, work_start_time, work_end_time, workforce_count, achievements, challenges, delays, corrective_actions, safety_observations, technical_observations, supervision_instructions, owner_instructions, next_plan, notes, submitted_at_server, reviewed_at, published_at",
      )
      .eq("id", report_id)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Report not found or not visible to you.");

    const report = {
      id: data.id,
      projectId: data.project_id,
      ref: data.report_ref,
      type: data.report_type,
      date: data.report_date,
      weekStart: data.week_start,
      weekEnd: data.week_end,
      state: data.state,
      status: data.status,
      isPublished: data.is_published,
      isLate: data.is_late,
      title: data.title,
      summary: data.summary,
      weather: data.weather,
      workArea: data.work_area,
      workStartTime: data.work_start_time,
      workEndTime: data.work_end_time,
      workforceCount: data.workforce_count,
      achievements: data.achievements,
      challenges: data.challenges,
      delays: data.delays,
      correctiveActions: data.corrective_actions,
      safetyObservations: data.safety_observations,
      technicalObservations: data.technical_observations,
      supervisionInstructions: data.supervision_instructions,
      ownerInstructions: data.owner_instructions,
      nextPlan: data.next_plan,
      notes: data.notes,
      submittedAt: data.submitted_at_server,
      reviewedAt: data.reviewed_at,
      publishedAt: data.published_at,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      structuredContent: { report },
    };
  },
});
