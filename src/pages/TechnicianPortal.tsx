import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useProjects, useMilestones, useSubMilestones, useProgressReports, useDeleteProgressReport,
} from "@/hooks/useBuildTrust";
import { useMyTasks, useUpdateTaskStatus, TaskStatus } from "@/hooks/useTasks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitProgressReportDialog } from "@/components/dialogs/SubmitProgressReportDialog";
import { ProgressReportDetailsDialog } from "@/components/dialogs/ProgressReportDetailsDialog";
import { LogOut, HardHat, ClipboardList, FileText, Calendar, ChevronRight, AlertCircle, Trash2, LayoutDashboard, History } from "lucide-react";
import logo from "@/assets/logo.jpg";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";


const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
};
const PRIORITY_CLASS: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-secondary text-secondary-foreground",
  high: "bg-warning/20 text-warning",
  urgent: "bg-destructive/15 text-destructive",
};

export default function TechnicianPortal() {
  const { user, profile, signOut } = useAuth();
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState<string>("");
  const [viewReport, setViewReport] = useState<any | null>(null);
  const activeProjectId = projectId || projects[0]?.id;
  const activeProject = projects.find((p: any) => p.id === activeProjectId);

  const { data: milestones = [] } = useMilestones(activeProjectId);
  const { data: subs = [] } = useSubMilestones(activeProjectId);
  const { data: myReports = [] } = useProgressReports({ projectId: activeProjectId, mineOnly: true });
  const { data: tasks = [] } = useMyTasks();
  const updateStatus = useUpdateTaskStatus();
  const deleteReport = useDeleteProgressReport();

  const onDeleteReport = async (id: string) => {
    if (!confirm("Delete this rejected report? This cannot be undone.")) return;
    try {
      await deleteReport.mutateAsync(id);
      toast.success("Report deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete");
    }
  };

  const projectTasks = useMemo(
    () => tasks.filter((t: any) => !activeProjectId || t.project_id === activeProjectId),
    [tasks, activeProjectId]
  );

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, any[]> = { todo: [], in_progress: [], blocked: [], done: [] };
    for (const t of projectTasks) g[(t.status as TaskStatus) ?? "todo"].push(t);
    return g;
  }, [projectTasks]);

  const milestoneTitle = (id?: string | null) =>
    id ? (milestones.find((m: any) => m.id === id)?.title ?? "") : "";

  const onChangeStatus = async (id: string, status: TaskStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success("Task updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const rejectedReports = myReports.filter((r: any) => r.status === "rejected");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logo} alt="BuildTrust" className="h-9 object-contain" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <HardHat className="h-4 w-4 text-primary" />
              <h1 className="text-sm font-display font-bold truncate">Field portal</h1>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.full_name || user?.email}
            </p>
          </div>
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
        {/* Project picker */}
        {projects.length === 0 ? (
          <div className="metric-card text-center py-12">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-display font-bold">No projects assigned</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ask your project manager to add you to a project.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Select value={activeProjectId ?? ""} onValueChange={setProjectId}>
                <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeProject && <StatusBadge status={activeProject.status} />}
            </div>

            {/* Rejected reports alert */}
            {rejectedReports.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">
                    {rejectedReports.length} report{rejectedReports.length > 1 ? "s" : ""} need{rejectedReports.length > 1 ? "" : "s"} your attention
                  </p>
                </div>
                <div className="space-y-2">
                  {rejectedReports.slice(0, 3).map((r: any) => {
                    const sub = subs.find((s: any) => s.id === r.sub_milestone_id);
                    return (
                      <div key={r.id} className="text-xs bg-card rounded p-2">
                        <p className="font-semibold">{sub?.title ?? "Sub-milestone"} — {r.quantity} {sub?.unit}</p>
                        {r.review_comment && <p className="text-muted-foreground mt-1 italic">"{r.review_comment}"</p>}
                        <div className="mt-2 flex items-center gap-2">
                          {sub && <SubmitProgressReportDialog projectId={activeProjectId!} sub={sub} />}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => onDeleteReport(r.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My tasks */}
            <section id="tasks" className="scroll-mt-20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-bold">My tasks</h2>
                </div>
                <span className="text-xs text-muted-foreground">{projectTasks.length} total</span>
              </div>

              {projectTasks.length === 0 ? (
                <div className="metric-card text-center py-8">
                  <p className="text-sm text-muted-foreground">No tasks assigned on this project.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {STATUS_ORDER.map((st) => grouped[st].length > 0 && (
                    <div key={st}>
                      <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                        {STATUS_LABEL[st]} · {grouped[st].length}
                      </p>
                      <div className="space-y-2">
                        {grouped[st].map((t: any) => (
                          <div key={t.id} className="metric-card">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm">{t.title}</p>
                                  <span className={`text-[10px] uppercase rounded px-1.5 py-0.5 font-bold ${PRIORITY_CLASS[t.priority] ?? PRIORITY_CLASS.normal}`}>
                                    {t.priority}
                                  </span>
                                </div>
                                {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description}</p>}
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  {t.due_date && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />{new Date(t.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                  {t.milestone_id && <span>· {milestoneTitle(t.milestone_id)}</span>}
                                </div>
                              </div>
                              <Select value={t.status} onValueChange={(v) => onChangeStatus(t.id, v as TaskStatus)}>
                                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {STATUS_ORDER.map((s) => (
                                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick report — list sub-milestones */}
            <section id="report" className="scroll-mt-20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-bold">Report progress</h2>
                </div>
              </div>
              {(() => {
                const hasActiveTask = projectTasks.some((t: any) => t.status !== "done");
                const visibleSubs = hasActiveTask
                  ? subs.filter((s: any) => Number(s.progress_pct) < 100)
                  : [];
                if (visibleSubs.length === 0) {
                  return (
                    <div className="metric-card text-center py-8">
                      <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-semibold">No assigned milestones yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your engineer or administrator must assign you a task on this project before you can report progress on its sub-milestones.
                      </p>
                    </div>
                  );
                }
                const byMilestone = new Map<string, any[]>();
                for (const s of visibleSubs) {
                  const key = s.milestone_id ?? "_none";
                  if (!byMilestone.has(key)) byMilestone.set(key, []);
                  byMilestone.get(key)!.push(s);
                }
                const orderedKeys = milestones
                  .map((m: any) => m.id)
                  .filter((id: string) => byMilestone.has(id))
                  .concat(byMilestone.has("_none") ? ["_none"] : []);
                return (
                <div className="space-y-5">
                  {orderedKeys.map((mid: string) => {
                    const m = milestones.find((mm: any) => mm.id === mid);
                    const items = byMilestone.get(mid)!;
                    return (
                      <div key={mid}>
                        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                          {m?.title ?? "Unassigned"} · {items.length}
                        </p>
                        <div className="space-y-2">
                          {items.map((s: any) => (
                            <div key={s.id} className="metric-card flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{s.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {s.completed_quantity}/{s.target_quantity} {s.unit} · {s.progress_pct}%
                                </p>
                              </div>
                              <SubmitProgressReportDialog projectId={activeProjectId!} sub={s} />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                );
              })()}
            </section>

            {/* My recent reports */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display font-bold text-sm">My recent reports</h2>
              </div>
              {myReports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet.</p>
              ) : (() => {
                const recent = myReports.slice(0, 20);
                const byMs = new Map<string, any[]>();
                for (const r of recent) {
                  const sub = subs.find((s: any) => s.id === r.sub_milestone_id);
                  const key = sub?.milestone_id ?? "_none";
                  if (!byMs.has(key)) byMs.set(key, []);
                  byMs.get(key)!.push(r);
                }
                const keys = milestones
                  .map((m: any) => m.id)
                  .filter((id: string) => byMs.has(id))
                  .concat(byMs.has("_none") ? ["_none"] : []);
                return (
                  <div className="space-y-5">
                    {keys.map((mid: string) => {
                      const m = milestones.find((mm: any) => mm.id === mid);
                      const items = byMs.get(mid)!;
                      return (
                        <div key={mid}>
                          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                            {m?.title ?? "Unassigned"} · {items.length}
                          </p>
                          <div className="space-y-2">
                            {items.map((r: any) => {
                              const sub = subs.find((s: any) => s.id === r.sub_milestone_id);
                              return (
                                <div
                                  key={r.id}
                                  className="w-full rounded-lg border p-3 flex items-center justify-between gap-3 hover:bg-muted/40 transition"
                                >
                                  <button
                                    onClick={() => setViewReport(r)}
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <p className="text-sm font-semibold truncate">{sub?.title ?? "Sub-milestone"}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {r.quantity} {sub?.unit} · {new Date(r.report_date).toLocaleDateString()}
                                    </p>
                                    {r.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                                    )}
                                  </button>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <StatusBadge status={r.status} />
                                    {r.status === "rejected" && (
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                        onClick={() => onDeleteReport(r.id)}
                                        title="Delete report"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>
          </>
        )}
      </main>

      <ProgressReportDetailsDialog
        open={!!viewReport}
        onOpenChange={(o) => !o && setViewReport(null)}
        report={viewReport}
        sub={viewReport ? subs.find((s: any) => s.id === viewReport.sub_milestone_id) : undefined}
      />
    </div>
  );
}
