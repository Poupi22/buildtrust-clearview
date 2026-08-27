import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { safeFileExt } from "@/lib/storage";

// ---------------- Projects ----------------
export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

// First project the user can see (used by Client Portal)
export function useFirstProject() {
  return useQuery({
    queryKey: ["first-project"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useClientUsers() {
  return useQuery({
    queryKey: ["client-users"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");
      if (rolesErr) throw rolesErr;
      const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
      if (!ids.length) return [];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", ids);
      if (pErr) throw pErr;
      return (profiles ?? []) as Array<{ user_id: string; full_name: string | null }>;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      type?: string;
      location?: string;
      start_date?: string | null;
      client_user_id?: string | null;
      client?: { email: string; full_name?: string; phone?: string; address?: string; company?: string } | null;
      members?: Array<{ user_id: string; role: "manager" | "engineer" | "technician" | "client" }>;
      documents?: Array<File | { file: File; title: string }>;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const code = `PRJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const { data, error } = await supabase
        .from("projects")
        .insert({
          title: input.title,
          code,
          type: input.type ?? null,
          location: input.location ?? null,
          start_date: input.start_date || null,
          client_name: input.client?.full_name?.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from("project_members").insert({
        project_id: data.id,
        user_id: user.id,
        role: "manager",
      });
      const extra = new Map<string, "manager" | "engineer" | "technician" | "client">();
      for (const m of input.members ?? []) {
        if (m.user_id && m.user_id !== user.id) extra.set(m.user_id, m.role);
      }
      if (input.client_user_id && input.client_user_id !== user.id) {
        extra.set(input.client_user_id, "client");
      }
      if (extra.size) {
        const { error: mErr } = await supabase.from("project_members").insert(
          Array.from(extra.entries()).map(([user_id, role]) => ({
            project_id: data.id,
            user_id,
            role,
          }))
        );
        if (mErr) throw mErr;
      }

      let clientCredentials: { email: string; password: string | null; created: boolean } | null = null;
      if (input.client?.email) {
        const { data: inv, error: invErr } = await supabase.functions.invoke("invite-client", {
          body: {
            project_id: data.id,
            email: input.client.email.trim(),
            full_name: input.client.full_name?.trim() ?? "",
            phone: input.client.phone?.trim() || null,
            address: input.client.address?.trim() || null,
            company: input.client.company?.trim() || null,
          },
        });
        if (invErr) throw invErr;
        if ((inv as any)?.error) throw new Error((inv as any).error);
        clientCredentials = {
          email: (inv as any).email,
          password: (inv as any).password ?? null,
          created: !!(inv as any).created,
        };
      }



      if (input.documents && input.documents.length) {
        for (const entry of input.documents) {
          const file = entry instanceof File ? entry : entry.file;
          const caption = entry instanceof File ? file.name : entry.title;
          const ext = safeFileExt(file.name);
          const path = `${data.id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("project-media")
            .upload(path, file, { contentType: file.type });
          if (upErr) throw upErr;
          const { error: mediaErr } = await supabase.from("media_files").insert({
            project_id: data.id,
            storage_path: path,
            mime_type: file.type,
            caption,
            uploaded_by: user.id,
          });
          if (mediaErr) throw mediaErr;
        }
      }
      return { ...data, client_credentials: clientCredentials };

    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project_members"] });
    },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      patch: Record<string, any>;
    }) => {
      const { error } = await supabase.from("projects").update(input.patch as any).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project", v.id] });
    },
  });
}

// ---------------- Milestones ----------------
export function useMilestones(projectId?: string) {
  return useQuery({
    queryKey: ["milestones", projectId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("milestones").select("*").order("ordering", { ascending: true });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ---------------- Project Reports (daily journal + weekly client reports) ----------------
export type ReportType = "daily" | "weekly";

export interface ReportInput {
  id?: string;
  project_id: string;
  report_type: ReportType;
  report_date: string;
  week_start?: string | null;
  week_end?: string | null;
  title?: string | null;
  summary?: string | null;
  achievements?: string | null;
  challenges?: string | null;
  next_plan?: string | null;
  weather?: string | null;
  workforce_count?: number | null;
  notes?: string | null;
  status?: "draft" | "submitted";
  /** Journal de Chantier structured sections + workflow links */
  obligation_id?: string | null;
  weekly_work_plan_id?: string | null;
  plan_version_id?: string | null;
  work_start_time?: string | null;
  work_end_time?: string | null;
  work_area?: string | null;
  personnel?: Array<{ poste: string; nombre: number }>;
  equipment?: Array<{ designation: string; utilisation: string }>;
  works_done?: Array<{ designation: string; observations: string }>;
  materials?: Array<{ designation: string; stock_matin: string; approvisionnement: string; consomme: string; stock_soir: string }>;
  owner_instructions?: string | null;
  supervision_instructions?: string | null;
  safety_observations?: string | null;
  technical_observations?: string | null;
  corrective_actions?: string | null;
  delays?: string | null;
}

export function useReports(projectId?: string, reportType?: ReportType) {
  return useQuery({
    queryKey: ["reports", projectId ?? "all", reportType ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      if (reportType) q = q.eq("report_type", reportType);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: ReportInput) => {
      if (!user) throw new Error("Not authenticated");
      const status = input.status ?? "submitted";
      const { data, error } = await supabase
        .from("daily_reports")
        .insert({
          project_id: input.project_id,
          report_type: input.report_type,
          report_date: input.report_date,
          week_start: input.week_start ?? null,
          week_end: input.week_end ?? null,
          title: input.title ?? null,
          summary: input.summary ?? null,
          achievements: input.achievements ?? null,
          challenges: input.challenges ?? null,
          next_plan: input.next_plan ?? null,
          weather: input.weather ?? null,
          workforce_count: input.workforce_count ?? 0,
          notes: input.notes ?? null,
          author_id: user.id,
          status,
          state: status === "submitted" ? "submitted" : "draft",
          obligation_id: input.obligation_id ?? null,
          weekly_work_plan_id: input.weekly_work_plan_id ?? null,
          plan_version_id: input.plan_version_id ?? null,
          work_start_time: input.work_start_time || null,
          work_end_time: input.work_end_time || null,
          work_area: input.work_area ?? null,
          personnel: (input.personnel ?? []) as any,
          equipment: (input.equipment ?? []) as any,
          works_done: (input.works_done ?? []) as any,
          materials: (input.materials ?? []) as any,
          owner_instructions: input.owner_instructions ?? null,
          supervision_instructions: input.supervision_instructions ?? null,
          safety_observations: input.safety_observations ?? null,
          technical_observations: input.technical_observations ?? null,
          corrective_actions: input.corrective_actions ?? null,
          delays: input.delays ?? null,
          report_ref: `${input.report_type === "weekly" ? "WR" : "DR"}-${input.report_date}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
          submitted_at: status === "submitted" ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useUpdateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ReportInput> & { id: string }) => {
      const { id, ...patch } = input as any;
      const { error } = await supabase
        .from("daily_reports")
        .update({
          ...patch,
          ...(patch.status ? { state: patch.status === "submitted" ? "submitted" : "draft" } : {}),
          submitted_at: patch.status === "submitted" ? new Date().toISOString() : undefined,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function usePublishWeeklyReport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("daily_reports")
        .update({
          status: "approved",
          state: "approved",
          is_published: true,
          published_at: new Date().toISOString(),
          published_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", input.id);
      if (error) throw error;
      await supabase.from("approvals").insert({
        project_id: input.project_id,
        entity_type: "daily_report",
        entity_id: input.id,
        decision: "approved",
        reviewer_id: user.id,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useReviewReport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string; decision: "approved" | "rejected"; reason?: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const patch: any = {
        status: input.decision === "approved" ? "approved" : "rejected",
        state: input.decision === "approved" ? "approved" : "rejected",
        review_comment: input.reason ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      };
      const { error } = await supabase.from("daily_reports").update(patch).eq("id", input.id);
      if (error) throw error;
      await supabase.from("approvals").insert({
        project_id: input.project_id,
        entity_type: "daily_report",
        entity_id: input.id,
        decision: input.decision,
        reviewer_id: user.id,
        comment: input.reason ?? null,
      });
      const { data: sig } = await supabase
        .from("signature_profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .maybeSingle();
      await supabase.from("report_approvals").insert({
        report_id: input.id,
        project_id: input.project_id,
        reviewer_id: user.id,
        decision: input.decision,
        reason: input.reason ?? null,
        signature_profile_id: sig?.id ?? null,
        signature_snapshot: sig ? ({ full_name: sig.full_name, initials: sig.initials, kind: sig.kind, version: sig.version, signature_data: sig.signature_data } as any) : null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

// ---------------- Issues ----------------
export function useIssues(projectId?: string) {
  return useQuery({
    queryKey: ["issues", projectId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("report_issues")
        .select("*")
        .order("date_identified", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      title: string;
      description?: string;
      impact?: string;
      severity?: "low" | "medium" | "high" | "critical";
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("report_issues")
        .insert({ ...input, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["issues"] }),
  });
}

// ---------------- Milestone mutations ----------------
// ---------------- Sub-milestones ----------------
export function useSubMilestones(projectId?: string, milestoneId?: string) {
  return useQuery({
    queryKey: ["sub_milestones", projectId ?? "all", milestoneId ?? "all"],
    enabled: projectId !== undefined ? !!projectId : true,
    queryFn: async () => {
      let q = supabase.from("sub_milestones" as any).select("*").order("ordering", { ascending: true });
      if (projectId) q = q.eq("project_id", projectId);
      if (milestoneId) q = q.eq("milestone_id", milestoneId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCreateSubMilestone() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      milestone_id: string;
      title: string;
      unit: string;
      target_quantity: number;
      contribution_pct: number;
      ordering?: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await (supabase.from("sub_milestones" as any).insert({
        ...input,
        created_by: user.id,
        ordering: input.ordering ?? 0,
      }).select().single() as any);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub_milestones"] });
      qc.invalidateQueries({ queryKey: ["milestones"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateSubMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Record<string, any> }) => {
      const { error } = await (supabase.from("sub_milestones" as any).update(input.patch).eq("id", input.id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub_milestones"] });
      qc.invalidateQueries({ queryKey: ["milestones"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteSubMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("sub_milestones" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sub_milestones"] });
      qc.invalidateQueries({ queryKey: ["milestones"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

// ---------------- Progress reports ----------------
export function useProgressReports(filters?: { projectId?: string; subMilestoneId?: string; mineOnly?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["progress_reports", filters?.projectId ?? "all", filters?.subMilestoneId ?? "all", filters?.mineOnly ? user?.id : "all"],
    queryFn: async () => {
      let q = supabase.from("progress_reports" as any).select("*").order("created_at", { ascending: false });
      if (filters?.projectId) q = q.eq("project_id", filters.projectId);
      if (filters?.subMilestoneId) q = q.eq("sub_milestone_id", filters.subMilestoneId);
      if (filters?.mineOnly && user) q = q.eq("author_id", user.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useCreateProgressReport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      sub_milestone_id: string;
      quantity: number;
      description?: string;
      report_date?: string;
      photos?: File[];
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data: report, error } = await (supabase.from("progress_reports" as any).insert({
        project_id: input.project_id,
        sub_milestone_id: input.sub_milestone_id,
        quantity: input.quantity,
        description: input.description,
        report_date: input.report_date ?? new Date().toISOString().slice(0, 10),
        author_id: user.id,
        status: 'submitted',
      }).select().single() as any);
      if (error) throw error;
      if (input.photos && input.photos.length) {
        for (const file of input.photos) {
          const ext = safeFileExt(file.name);
          const path = `${input.project_id}/${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await supabase.storage.from("project-media").upload(path, file, { contentType: file.type });
          if (upErr) throw upErr;
          const { error: mediaErr } = await supabase.from("media_files").insert({
            project_id: input.project_id,
            storage_path: path,
            mime_type: file.type,
            uploaded_by: user.id,
            progress_report_id: report.id,
          } as any);
          if (mediaErr) throw mediaErr;
        }
      }
      return report;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress_reports"] });
      qc.invalidateQueries({ queryKey: ["sub_milestones"] });
      qc.invalidateQueries({ queryKey: ["milestones"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useReviewProgressReport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; decision: "approved" | "rejected"; comment?: string; publish?: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase.from("progress_reports" as any).update({
        status: input.decision,
        review_comment: input.comment ?? null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        is_published: input.decision === "approved" ? (input.publish ?? true) : false,
      }).eq("id", input.id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress_reports"] });
      qc.invalidateQueries({ queryKey: ["sub_milestones"] });
      qc.invalidateQueries({ queryKey: ["milestones"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function usePublishProgressReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; is_published: boolean }) => {
      const { error } = await (supabase.from("progress_reports" as any).update({ is_published: input.is_published }).eq("id", input.id) as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress_reports"] }),
  });
}

export function useDeleteProgressReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("progress_reports" as any).delete().eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["progress_reports"] });
      qc.invalidateQueries({ queryKey: ["sub_milestones"] });
    },
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      title: string;
      planned_date?: string | null;
      ordering?: number;
      contribution_pct?: number;
    }) => {
      const { data, error } = await supabase
        .from("milestones")
        .insert({ ...input, ordering: input.ordering ?? 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["milestones", v.project_id] });
      qc.invalidateQueries({ queryKey: ["milestones", "all"] });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      project_id: string;
      progress?: number;
      status?: "pending" | "in-progress" | "completed" | "delayed";
      actual_date?: string | null;
      is_published?: boolean;
      contribution_pct?: number;
      title?: string;
      planned_date?: string | null;
    }) => {
      const { id, project_id, ...patch } = input;
      const { error } = await supabase.from("milestones").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["milestones", v.project_id] });
      qc.invalidateQueries({ queryKey: ["milestones", "all"] });
    },
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      const { error } = await supabase.from("milestones").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["milestones", v.project_id] });
    },
  });
}

// ---------------- Media files ----------------
export function useMedia(projectId?: string) {
  return useQuery({
    queryKey: ["media", projectId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("media_files").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function getMediaUrl(path: string) {
  return supabase.storage.from("project-media").getPublicUrl(path).data.publicUrl;
}

export function useUploadMedia() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { project_id: string; file: File; caption?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const ext = safeFileExt(input.file.name);
      const path = `${input.project_id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("project-media")
        .upload(path, input.file, { contentType: input.file.type });
      if (upErr) throw upErr;
      const { error } = await supabase.from("media_files").insert({
        project_id: input.project_id,
        storage_path: path,
        mime_type: input.file.type,
        caption: input.caption,
        uploaded_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["media", v.project_id] }),
  });
}

export function useUpdateMediaCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string; caption: string }) => {
      const { error } = await supabase
        .from("media_files")
        .update({ caption: input.caption })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["media", v.project_id] }),
  });
}

export function useToggleMediaPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("media_files")
        .update({ is_published: input.is_published })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["media", v.project_id] }),
  });
}

// ---------------- Team / members ----------------
export function useAllProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useProjectMembers(projectId?: string) {
  return useQuery({
    queryKey: ["project_members", projectId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("project_members").select("*");
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      user_id: string;
      role: "manager" | "engineer" | "technician" | "client";
    }) => {
      const { error } = await supabase.from("project_members").insert(input as any);
      if (error) throw error;
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_members"] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const { error } = await supabase.from("project_members").delete().eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project_members"] });
    },
  });
}

export function useIsAdmin() {
  const { role } = useAuth();
  return role === "super-admin" || role === "company-admin";
}

export function useIsSuperAdmin() {
  const { role } = useAuth();
  return role === "super-admin";
}

// ---------------- Milestone review workflow ----------------
export function useReviewMilestone() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      project_id: string;
      decision: "approved" | "rejected";
      comment?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("milestones")
        .update({
          review_status: input.decision,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_comment: input.comment ?? null,
        })
        .eq("id", input.id);
      if (error) throw error;
      await supabase.from("approvals").insert({
        project_id: input.project_id,
        entity_type: "milestone",
        entity_id: input.id,
        decision: input.decision,
        reviewer_id: user.id,
        comment: input.comment ?? null,
      });
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["milestones", v.project_id] });
      qc.invalidateQueries({ queryKey: ["milestones", "all"] });
      qc.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useSubmitMilestoneForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from("milestones")
        .update({ review_status: "pending_review", submitted_at: new Date().toISOString() })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["milestones", v.project_id] });
      qc.invalidateQueries({ queryKey: ["milestones", "all"] });
    },
  });
}
