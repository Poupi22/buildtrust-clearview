import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { sanitizeFileName } from "@/lib/storage";

export type PlanVersionStatus = "draft" | "submitted" | "active" | "archived";
export type WeeklyPlanStatus = "draft" | "submitted" | "active" | "closed" | "void";

/* ------------------------------------------------------------------ */
/* Baseline plan versions                                              */
/* ------------------------------------------------------------------ */

export function usePlanVersions(projectId?: string) {
  return useQuery({
    queryKey: ["plan-versions", projectId ?? "all"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_plan_versions")
        .select("*")
        .eq("project_id", projectId!)
        .order("version_no", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActivePlanVersion(projectId?: string) {
  return useQuery({
    queryKey: ["plan-version-active", projectId ?? "all"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_plan_versions")
        .select("*")
        .eq("project_id", projectId!)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSubmitPlanVersion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      title: string;
      planned_start_date?: string | null;
      planned_end_date?: string | null;
      period_label?: string | null;
      revision_reason?: string | null;
      file?: File | null;
      activities?: Array<{ title: string; planned_start?: string | null; planned_end?: string | null; dependency?: string | null }>;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("project_plan_versions")
        .select("id, version_no")
        .eq("project_id", input.project_id)
        .order("version_no", { ascending: false })
        .limit(1);
      const previous = existing?.[0];
      const nextNo = (previous?.version_no ?? 0) + 1;

      let file_path: string | null = null;
      if (input.file) {
        const safeName = sanitizeFileName(input.file.name);
        const path = `${input.project_id}/plans/v${nextNo}-${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("project-media").upload(path, input.file);
        if (upErr) throw upErr;
        file_path = path;
      }

      const { data, error } = await supabase
        .from("project_plan_versions")
        .insert({
          project_id: input.project_id,
          version_no: nextNo,
          title: input.title,
          status: "submitted",
          planned_start_date: input.planned_start_date || null,
          planned_end_date: input.planned_end_date || null,
          period_label: input.period_label || null,
          revision_reason: input.revision_reason || null,
          previous_version_id: previous?.id ?? null,
          file_path,
          submitted_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const acts = (input.activities ?? []).filter((a) => a.title.trim());
      if (acts.length) {
        const { error: aErr } = await supabase.from("plan_activities").insert(
          acts.map((a, i) => ({
            plan_version_id: data.id,
            project_id: input.project_id,
            title: a.title,
            planned_start: a.planned_start || null,
            planned_end: a.planned_end || null,
            dependency: a.dependency || null,
            ordering: i,
          })),
        );
        if (aErr) throw aErr;
      }
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["plan-versions"] });
      qc.invalidateQueries({ queryKey: ["plan-version-active", v.project_id] });
    },
  });
}

/** Super-admin only: activate a submitted version (auto-archives the previous one). */
export function useActivatePlanVersion() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; admin_note?: string | null }) => {
      const { error } = await supabase
        .from("project_plan_versions")
        .update({
          status: "active",
          activated_at: new Date().toISOString(),
          activated_by: user?.id ?? null,
          admin_note: input.admin_note || null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plan-versions"] });
      qc.invalidateQueries({ queryKey: ["plan-version-active"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function usePlanActivities(planVersionId?: string) {
  return useQuery({
    queryKey: ["plan-activities", planVersionId ?? "none"],
    enabled: !!planVersionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_activities")
        .select("*")
        .eq("plan_version_id", planVersionId!)
        .order("ordering");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ------------------------------------------------------------------ */
/* Weekly work plans                                                    */
/* ------------------------------------------------------------------ */

export function useWeeklyPlans(projectId?: string) {
  return useQuery({
    queryKey: ["weekly-plans", projectId ?? "all"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_work_plans")
        .select("*")
        .eq("project_id", projectId!)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWorkDays(weeklyPlanId?: string) {
  return useQuery({
    queryKey: ["work-days", weeklyPlanId ?? "none"],
    enabled: !!weeklyPlanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_work_days")
        .select("*")
        .eq("weekly_work_plan_id", weeklyPlanId!)
        .order("work_date");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePlannedActivities(weeklyPlanId?: string) {
  return useQuery({
    queryKey: ["planned-activities", weeklyPlanId ?? "none"],
    enabled: !!weeklyPlanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planned_activities")
        .select("*")
        .eq("weekly_work_plan_id", weeklyPlanId!)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function isoWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

export function useCreateWeeklyPlan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      plan_version_id?: string | null;
      start_date: string;
      end_date: string;
      workingDays: string[];
      notes?: string | null;
      expected_outcome?: string | null;
      activities?: Array<{
        work_date: string;
        title: string;
        milestone_id?: string | null;
        sub_milestone_id?: string | null;
        responsible_id?: string | null;
        planned_quantity?: number | null;
        unit?: string | null;
        expected_outcome?: string | null;
      }>;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { week, year } = isoWeek(new Date(input.start_date));

      const { data: plan, error } = await supabase
        .from("weekly_work_plans")
        .insert({
          project_id: input.project_id,
          plan_version_id: input.plan_version_id ?? null,
          week_no: week,
          year,
          start_date: input.start_date,
          end_date: input.end_date,
          notes: input.notes || null,
          expected_outcome: input.expected_outcome || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const days: string[] = [];
      const cur = new Date(input.start_date);
      const end = new Date(input.end_date);
      while (cur <= end) {
        days.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
      const { data: dayRows, error: dErr } = await supabase
        .from("weekly_work_days")
        .insert(
          days.map((d) => ({
            weekly_work_plan_id: plan.id,
            project_id: input.project_id,
            work_date: d,
            is_working_day: input.workingDays.includes(d),
          })),
        )
        .select();
      if (dErr) throw dErr;

      const acts = (input.activities ?? []).filter((a) => a.title.trim());
      if (acts.length) {
        const { error: aErr } = await supabase.from("planned_activities").insert(
          acts.map((a) => ({
            weekly_work_plan_id: plan.id,
            work_day_id: (dayRows ?? []).find((d: any) => d.work_date === a.work_date)?.id ?? null,
            project_id: input.project_id,
            title: a.title,
            milestone_id: a.milestone_id || null,
            sub_milestone_id: a.sub_milestone_id || null,
            responsible_id: a.responsible_id || null,
            planned_quantity: a.planned_quantity ?? null,
            unit: a.unit || null,
            expected_outcome: a.expected_outcome || null,
          })),
        );
        if (aErr) throw aErr;
      }
      return plan;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["weekly-plans", v.project_id] });
    },
  });
}

/** Activating locks working days and generates the reporting obligations server-side. */
export function useSetWeeklyPlanStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: WeeklyPlanStatus }) => {
      const { error } = await supabase
        .from("weekly_work_plans")
        .update({
          status: input.status,
          ...(input.status === "closed" ? { closed_at: new Date().toISOString() } : {}),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["weekly-plans"] });
      qc.invalidateQueries({ queryKey: ["work-days"] });
      qc.invalidateQueries({ queryKey: ["obligations"] });
    },
  });
}

/* ------------------------------------------------------------------ */
/* Obligations & compliance                                             */
/* ------------------------------------------------------------------ */

export function useObligations(projectId?: string) {
  return useQuery({
    queryKey: ["obligations", projectId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("report_obligations").select("*").order("due_date", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMyOpenObligations() {
  return useQuery({
    queryKey: ["obligations-open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_obligations")
        .select("*")
        .eq("status", "pending")
        .order("due_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useComplianceEvents(projectId?: string) {
  return useQuery({
    queryKey: ["compliance-events", projectId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("compliance_events").select("*").order("event_date", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAnnotateComplianceEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; admin_note: string }) => {
      const { error } = await supabase
        .from("compliance_events")
        .update({ admin_note: input.admin_note })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["compliance-events"] }),
  });
}

/* ------------------------------------------------------------------ */
/* Signatures                                                           */
/* ------------------------------------------------------------------ */

export function useMySignature() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["signature", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signature_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_current", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRegisterSignature() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (input: { kind: "initials" | "drawn"; initials?: string; signature_data?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: current } = await supabase
        .from("signature_profiles")
        .select("id, version")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .maybeSingle();
      if (current) {
        await supabase.from("signature_profiles").update({ is_current: false }).eq("id", current.id);
      }
      const { error } = await supabase.from("signature_profiles").insert({
        user_id: user.id,
        version: (current?.version ?? 0) + 1,
        kind: input.kind,
        initials: input.initials ?? null,
        signature_data: input.signature_data ?? null,
        full_name: profile?.full_name ?? null,
        is_current: true,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signature"] }),
  });
}

/* ------------------------------------------------------------------ */
/* Report comments                                                      */
/* ------------------------------------------------------------------ */

export function useReportComments(reportId?: string) {
  return useQuery({
    queryKey: ["report-comments", reportId ?? "none"],
    enabled: !!reportId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_comments")
        .select("*")
        .eq("report_id", reportId!)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddReportComment() {
  const qc = useQueryClient();
  const { user, role } = useAuth();
  return useMutation({
    mutationFn: async (input: { project_id: string; report_id: string; body: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("report_comments").insert({
        project_id: input.project_id,
        report_id: input.report_id,
        author_id: user.id,
        author_role: role ?? null,
        body: input.body,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["report-comments", v.report_id] }),
  });
}

/* ------------------------------------------------------------------ */
/* Project documents                                                    */
/* ------------------------------------------------------------------ */

export function useProjectDocuments(projectId?: string) {
  return useQuery({
    queryKey: ["project-documents", projectId ?? "all"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*, document_versions(*)")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUploadProjectDocument() {
  const qc = useQueryClient();
  const { user, role } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      title: string;
      category: string;
      description?: string | null;
      visibility?: string;
      file: File;
      document_id?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      let documentId = input.document_id;
      let version = 1;

      if (documentId) {
        const { data: doc } = await supabase
          .from("project_documents")
          .select("current_version")
          .eq("id", documentId)
          .maybeSingle();
        version = (doc?.current_version ?? 1) + 1;
      } else {
        const { data: doc, error } = await supabase
          .from("project_documents")
          .insert({
            project_id: input.project_id,
            title: input.title,
            category: input.category,
            description: input.description || null,
            visibility: input.visibility ?? "project",
            uploaded_by: user.id,
            uploader_role: role ?? null,
          })
          .select()
          .single();
        if (error) throw error;
        documentId = doc.id;
      }

      const safeDocName = sanitizeFileName(input.file.name);
      const path = `${input.project_id}/documents/${documentId}/v${version}-${safeDocName}`;
      const { error: upErr } = await supabase.storage.from("project-media").upload(path, input.file);
      if (upErr) throw upErr;

      const { error: vErr } = await supabase.from("document_versions").insert({
        document_id: documentId!,
        project_id: input.project_id,
        version,
        storage_path: path,
        mime_type: input.file.type,
        uploaded_by: user.id,
      });
      if (vErr) throw vErr;

      if (version > 1) {
        await supabase.from("project_documents").update({ current_version: version }).eq("id", documentId!);
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["project-documents", v.project_id] }),
  });
}

/* ------------------------------------------------------------------ */
/* Client assistant / architect                                         */
/* ------------------------------------------------------------------ */

export function useProjectAssistants(projectId?: string) {
  return useQuery({
    queryKey: ["project-assistants", projectId ?? "all"],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_assistant_access")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useToggleAssistant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("client_assistant_access")
        .update({ is_active: input.is_active })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-assistants"] }),
  });
}
