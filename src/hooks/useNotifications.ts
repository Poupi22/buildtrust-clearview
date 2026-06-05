import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  project_id: string | null;
  is_read: boolean;
  created_at: string;
};

export function useNotifications(limit = 30) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase.from("notifications" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit) as any);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
          const n = payload.new as Notification;
          toast(n.title, { description: n.body ?? undefined });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications", user.id] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, qc]);

  return query;
}

export function useUnreadCount() {
  const { data = [] } = useNotifications();
  return data.filter((n) => !n.is_read).length;
}

export function useMarkRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("notifications" as any).update({ is_read: true }).eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { error } = await (supabase.from("notifications" as any)
        .update({ is_read: true })
        .eq("user_id", user?.id)
        .eq("is_read", false) as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}
