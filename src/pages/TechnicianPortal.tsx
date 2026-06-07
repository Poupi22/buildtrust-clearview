import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useProjects, useMilestones, useSubMilestones, useProgressReports, useDeleteProgressReport,
  useReports,
} from "@/hooks/useBuildTrust";
import { useMyTasks, useUpdateTaskStatus, TaskStatus } from "@/hooks/useTasks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { SubmitProgressReportDialog } from "@/components/dialogs/SubmitProgressReportDialog";
import { ProgressReportDetailsDialog } from "@/components/dialogs/ProgressReportDetailsDialog";
import { ReportFormDialog } from "@/components/dialogs/ReportFormDialog";
import {
  LogOut, HardHat, ClipboardList, FileText, Calendar, ChevronRight,
  AlertCircle, Trash2, History, LayoutDashboard, NotebookPen,
} from "lucide-react";
import logo from "@/assets/logo.jpg";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

type ViewKey = "overview" | "tasks" | "report" | "journal" | "recent";

export default function TechnicianPortal() {
  const { user, profile, signOut } = useAuth();
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState<string>("");
  const [view, setView] = useState<ViewKey>("overview");
  const [viewReport, setViewReport] = useState<any | null>(null);
  const activeProjectId = projectId || projects[0]?.id;
  const activeProject = projects.find((p: any) => p.id === activeProjectId);

  const { data: milestones = [] } = useMilestones(activeProjectId);
  const { data: subs = [] } = useSubMilestones(activeProjectId);
  const { data: myReports = [] } = useProgressReports({ projectId: activeProjectId, mineOnly: true });
  const { data: journalReports = [] } = useReports(activeProjectId);
  const myJournal = journalReports.filter((r: any) => r.author_id === user?.id);
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
  const openTasksCount = projectTasks.filter((t: any) => t.status !== "done").length;

  const activeTasks = projectTasks.filter((t: any) => t.status !== "done");
  const allowedMilestoneIds = new Set(activeTasks.map((t: any) => t.milestone_id).filter(Boolean));
  const allowedSubIds = new Set(activeTasks.map((t: any) => t.sub_milestone_id).filter(Boolean));
  const isAllowedSub = (s: any) =>
    (allowedSubIds.size > 0 && allowedSubIds.has(s.id)) || allowedMilestoneIds.has(s.milestone_id);
  const allowedSubs = subs.filter(isAllowedSub);
  const remainingAllowedSubs = allowedSubs.filter((s: any) => Number(s.progress_pct) < 100);

  const navItems: { key: ViewKey; label: string; icon: any; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "tasks", label: "My Tasks", icon: ClipboardList, badge: openTasksCount || undefined },
    { key: "report", label: "Report Progress", icon: FileText },
    { key: "journal", label: "Journal", icon: NotebookPen },
    { key: "recent", label: "My Reports", icon: History, badge: rejectedReports.length || undefined },
  ];

  const JournalSection = () => (
    <section className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-lg">Project journal</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Submit your daily site report (internal) and weekly summary (sent to the engineer for validation, then visible to the client).
        </p>
      </div>
      {activeProjectId ? (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="metric-card">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Daily</p>
            <p className="font-display font-bold mt-1">Today's site report</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Workforce, weather, what happened today. Internal only.</p>
            <ReportFormDialog type="daily" defaultProjectId={activeProjectId} />
          </div>
          <div className="metric-card">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Weekly</p>
            <p className="font-display font-bold mt-1">This week's client report</p>
            <p className="text-xs text-muted-foreground mt-1 mb-3">Summary, achievements, next-week plan. Reviewed before publication.</p>
            <ReportFormDialog type="weekly" defaultProjectId={activeProjectId} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select a project first.</p>
      )}
    </section>
  );

  const TasksSection = () => (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg">My tasks</h2>
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
                      <span className="text-[10px] uppercase rounded px-2 py-1 font-bold bg-muted text-muted-foreground whitespace-nowrap">
                        {STATUS_LABEL[(t.status as TaskStatus) ?? "todo"]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const ReportSection = () => {
    const visibleSubs = remainingAllowedSubs;
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
      <section>
        <h2 className="font-display font-bold text-lg mb-3">Report progress</h2>
        {visibleSubs.length === 0 ? (
          <div className="metric-card text-center py-8">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold">No assigned milestones yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your engineer or administrator must assign you a task on this project before you can report progress on its sub-milestones.
            </p>
          </div>
        ) : (
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
        )}
      </section>
    );
  };

  const RecentSection = () => {
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
      <section>
        <h2 className="font-display font-bold text-lg mb-3">My recent reports</h2>
        {myReports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        ) : (
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
                          <button onClick={() => setViewReport(r)} className="min-w-0 flex-1 text-left">
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
        )}
      </section>
    );
  };

  const OverviewSection = () => (
    <section className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl">
          Welcome back, {profile?.full_name?.split(" ")[0] || "Field tech"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {activeProject ? `Working on ${activeProject.title}` : "Pick a project to get started"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button onClick={() => setView("tasks")} className="metric-card text-left hover:border-primary transition">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <ClipboardList className="h-3.5 w-3.5" /> Open tasks
          </div>
          <p className="text-3xl font-display font-bold mt-2">{openTasksCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{projectTasks.length} total assigned</p>
        </button>
        <button onClick={() => setView("report")} className="metric-card text-left hover:border-primary transition">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <FileText className="h-3.5 w-3.5" /> Sub-milestones
          </div>
          <p className="text-3xl font-display font-bold mt-2">
            {remainingAllowedSubs.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">remaining to complete</p>
        </button>
        <button onClick={() => setView("recent")} className="metric-card text-left hover:border-primary transition">
          <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
            <History className="h-3.5 w-3.5" /> My reports
          </div>
          <p className="text-3xl font-display font-bold mt-2">{myReports.length}</p>
          <p className="text-xs text-destructive mt-1">
            {rejectedReports.length > 0 ? `${rejectedReports.length} rejected · needs attention` : "All clear"}
          </p>
        </button>
      </div>

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
    </section>
  );

  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-card border-r h-screen sticky top-0">
        <div className="p-5 border-b">
          <img src={logo} alt="BuildTrust" className="h-10 object-contain" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = view === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge ? (
                  <span className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                  )}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {profile?.avatar_initials || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{profile?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">Technician</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Sign out">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3 lg:px-6">
          <div className="lg:hidden">
            <img src={logo} alt="BuildTrust" className="h-8 object-contain" />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <HardHat className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-display font-bold">Field Portal</h2>
          </div>
          <div className="flex items-center gap-3">
            {projects.length > 0 && (
              <Select value={activeProjectId ?? ""} onValueChange={setProjectId}>
                <SelectTrigger className="w-48 h-9 text-xs"><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {activeProject && <StatusBadge status={activeProject.status} />}
            <NotificationBell />
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t safe-area-bottom">
          <div className="flex items-center justify-around py-2">
            {navItems.map((item) => {
              const active = view === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors relative",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="absolute top-0 right-1 bg-primary text-primary-foreground rounded-full text-[9px] px-1">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 px-4 py-6 lg:px-8 pb-24 lg:pb-8 max-w-5xl w-full mx-auto">
          {projects.length === 0 ? (
            <div className="metric-card text-center py-12">
              <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-display font-bold">No projects assigned</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Ask your project manager to add you to a project.
              </p>
            </div>
          ) : view === "overview" ? <OverviewSection />
            : view === "tasks" ? <TasksSection />
            : view === "report" ? <ReportSection />
            : view === "journal" ? <JournalSection />
            : <RecentSection />}
        </main>
      </div>

      <ProgressReportDetailsDialog
        open={!!viewReport}
        onOpenChange={(o) => !o && setViewReport(null)}
        report={viewReport}
        sub={viewReport ? subs.find((s: any) => s.id === viewReport.sub_milestone_id) : undefined}
      />
    </div>
  );
}
