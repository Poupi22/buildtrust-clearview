import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      title: string;
      code: string;
      client_name?: string;
      type?: string;
      location?: string;
      planned_end_date?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...input, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      // auto-add creator as manager so they can see it
      await supabase.from("project_members").insert({
        project_id: data.id,
        user_id: user.id,
        role: "manager",
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
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

// ---------------- Daily Reports ----------------
export function useReports(projectId?: string) {
  return useQuery({
    queryKey: ["reports", projectId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("daily_reports")
        .select("*")
        .order("report_date", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
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
    mutationFn: async (input: {
      project_id: string;
      report_date: string;
      weather?: string;
      workforce_count?: number;
      tasks_completed?: string[];
      notes?: string;
      status?: "draft" | "submitted";
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("daily_reports")
        .insert({
          ...input,
          author_id: user.id,
          status: input.status ?? "draft",
          submitted_at: input.status === "submitted" ? new Date().toISOString() : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useReviewReport() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: { id: string; project_id: string; decision: "approved" | "rejected" }) => {
      if (!user) throw new Error("Not authenticated");
      const newStatus = input.decision === "approved" ? "published" : "rejected";
      const { error } = await supabase
        .from("daily_reports")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq("id", input.id);
      if (error) throw error;
      await supabase.from("approvals").insert({
        project_id: input.project_id,
        entity_type: "daily_report",
        entity_id: input.id,
        decision: input.decision,
        reviewer_id: user.id,
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
export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      title: string;
      planned_date?: string | null;
      ordering?: number;
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
      const ext = input.file.name.split(".").pop();
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
      role: "manager" | "engineer" | "client";
    }) => {
      const { error } = await supabase.from("project_members").insert(input);
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
