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
