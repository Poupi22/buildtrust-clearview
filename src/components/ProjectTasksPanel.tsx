import { useState } from "react";
import { useProjectTasks, useUpdateTaskStatus, useDeleteTask, TaskStatus } from "@/hooks/useTasks";
import { useAllProfiles } from "@/hooks/useBuildTrust";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ClipboardList, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

const STATUSES: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do", in_progress: "In progress", done: "Done", blocked: "Blocked",
};
const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-warning/20 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export function ProjectTasksPanel({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const { data: tasks = [] } = useProjectTasks(projectId);
  const { data: profiles = [] } = useAllProfiles();
  const update = useUpdateTaskStatus();
  const remove = useDeleteTask();
  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

  const filtered = filter === "all" ? tasks : tasks.filter((t: any) => t.status === filter);

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-primary" />
          <h3 className="font-display font-bold">Tasks</h3>
          <span className="text-xs text-muted-foreground">{tasks.length} total</span>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No tasks {filter !== "all" ? `with status "${filter}"` : "yet"}.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((t: any) => {
            const assignee: any = profileMap.get(t.assigned_to);
            return (
              <div key={t.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{t.title}</p>
                      <span className={`text-[10px] uppercase rounded px-1.5 py-0.5 font-bold ${PRIORITY_CLASS[t.priority] ?? PRIORITY_CLASS.normal}`}>
                        {t.priority}
                      </span>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>👤 {assignee?.full_name ?? t.assigned_to.slice(0, 8)}</span>
                      {t.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />{new Date(t.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canManage ? (
                      <Select value={t.status} onValueChange={async (v) => {
                        try { await update.mutateAsync({ id: t.id, status: v as TaskStatus }); toast.success("Updated"); }
                        catch (e: any) { toast.error(e.message ?? "Failed"); }
                      }}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["todo", "in_progress", "blocked", "done"] as TaskStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs font-semibold">{STATUS_LABEL[t.status as TaskStatus] ?? t.status}</span>
                    )}
                    {canManage && (
                      <Button size="icon" variant="ghost" onClick={async () => {
                        try { await remove.mutateAsync(t.id); toast.success("Deleted"); }
                        catch (e: any) { toast.error(e.message ?? "Failed"); }
                      }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
