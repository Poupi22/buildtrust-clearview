import { useState } from "react";
import {
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Camera,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useFirstProject, useMilestones, useReports, useMedia, getMediaUrl, useSubMilestones, useProgressReports } from "@/hooks/useBuildTrust";
import { Download } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ClientPhotoGallery } from "@/components/ClientPhotoGallery";
import logo from "@/assets/logo.jpg";

type PortalTab = "overview" | "milestones" | "updates" | "photos" | "documents";

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState<PortalTab>("overview");
  const { data: project, isLoading } = useFirstProject();
  const { data: milestones = [] } = useMilestones(project?.id);
  const { data: reports = [] } = useReports(project?.id);
  const { signOut } = useAuth();
  const { data: media = [] } = useMedia(project?.id);
  const { data: subs = [] } = useSubMilestones(project?.id);
  const { data: progress = [] } = useProgressReports({ projectId: project?.id });

  // Defensive client-side filter; RLS already restricts.
  const publishedReports = reports.filter((r) => r.status === "approved" || r.status === "published");
  const publishedMilestones = milestones.filter((m: any) => m.is_published && m.review_status === "approved");
  const publishedMedia = media.filter((f: any) => f.is_published);
  const publishedPhotos = publishedMedia.filter((f: any) => (f.mime_type ?? "").startsWith("image/"));
  const publishedDocs = publishedMedia.filter((f: any) => !(f.mime_type ?? "").startsWith("image/"));
  const publishedSubs = subs.filter((s: any) => s.is_published || publishedMilestones.find((m: any) => m.id === s.milestone_id));
  const publishedProgress = progress.filter((p: any) => p.status === "approved" && p.is_published);

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleString() : "—");
  const lastMilestoneUpdate = publishedMilestones.reduce<string | null>(
    (acc, m: any) => (!acc || (m.updated_at && m.updated_at > acc) ? m.updated_at : acc),
    null,
  );
  const lastMediaUpdate = publishedMedia.reduce<string | null>(
    (acc, f: any) => (!acc || (f.created_at && f.created_at > acc) ? f.created_at : acc),
    null,
  );
  const lastReportUpdate = publishedReports.reduce<string | null>(
    (acc, r: any) => (!acc || (r.reviewed_at && r.reviewed_at > acc) ? r.reviewed_at : acc),
    null,
  );

  const tabs: { key: PortalTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "milestones", label: "Milestones", icon: CheckCircle2 },
    { key: "updates", label: "Updates", icon: FileText },
    { key: "photos", label: "Site Photos", icon: Camera },
    { key: "documents", label: "Documents", icon: FileText },
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading project...</div>;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h1 className="font-display font-bold text-lg">No project assigned</h1>
          <p className="text-sm text-muted-foreground mt-1">Your project will appear here once an administrator grants access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="BuildTrust" className="h-8 object-contain" />
            <div className="hidden sm:block h-6 w-px bg-border" />
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground font-medium">Client Portal</p>
              <p className="text-sm font-display font-bold">{project.client_name ?? "Client"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="hidden sm:flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span>Verified & Approved Updates Only</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5 mr-1" />Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        <div className="metric-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <p className="text-xs font-medium text-primary tracking-wide uppercase">{project.code}</p>
            <h1 className="text-xl lg:text-2xl font-display font-bold mt-1">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              {project.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{project.location}</span>}
              {project.type && <span className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{project.type}</span>}
              {project.planned_end_date && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Target: {project.planned_end_date}</span>}
            </div>

            <div className="mt-5 p-4 rounded-xl bg-muted/50 border">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Overall Completion</p>
                  <p className="text-3xl font-display font-bold text-primary">{project.completion}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Current Phase</p>
                  <p className="text-sm font-semibold">{project.current_phase ?? "—"}</p>
                </div>
              </div>
              <ProgressBar value={project.completion} size="lg" />
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Milestones Done" value={publishedMilestones.filter((m) => m.status === "completed").length} total={publishedMilestones.length} icon={<CheckCircle2 className="h-5 w-5 text-success" />} />
              <StatCard label="In Progress" value={publishedMilestones.filter((m) => m.status === "in-progress").length} icon={<Clock className="h-5 w-5 text-primary" />} />
              <StatCard label="Published Updates" value={publishedReports.length} icon={<FileText className="h-5 w-5 text-primary" />} />
              <StatCard label="Site Photos" value={publishedMedia.length} icon={<Camera className="h-5 w-5 text-accent" />} />
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h3 className="font-display font-bold">Milestone Progress</h3>
                {lastMilestoneUpdate && <p className="text-xs text-muted-foreground">Last updated {fmt(lastMilestoneUpdate)}</p>}
              </div>
              {publishedMilestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestone updates published yet.</p>
              ) : (
                <div className="space-y-3">
                  {publishedMilestones.map((m) => (
                    <div key={m.id} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full shrink-0 ${m.status === "completed" ? "bg-success" : "bg-primary animate-pulse"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{m.title}</span>
                          <StatusBadge status={m.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {m.actual_date ? `Completed: ${m.actual_date}` : `Updated: ${fmt(m.updated_at)}`}
                        </p>
                      </div>
                      <span className="text-sm font-display font-bold shrink-0">{m.progress}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="space-y-3">
            {lastMilestoneUpdate && (
              <p className="text-xs text-muted-foreground">Last updated {fmt(lastMilestoneUpdate)}</p>
            )}
            {publishedMilestones.length === 0 ? (
              <div className="metric-card text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-display font-bold">No Milestones Published</h3>
                <p className="text-sm text-muted-foreground mt-1">Milestones appear once your project manager publishes them.</p>
              </div>
            ) : publishedMilestones.map((m) => {
              const milestoneSubs = publishedSubs.filter((s: any) => s.milestone_id === m.id);
              return (
                <div key={m.id} className="metric-card">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                      m.status === "completed" ? "bg-success/10 text-success" :
                      m.status === "in-progress" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {m.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-sm">{m.title}</span>
                        <StatusBadge status={m.status} />
                        <span className="text-xs text-muted-foreground">· {m.contribution_pct ?? 0}% of project</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Planned: {m.planned_date ?? "—"}{m.actual_date && ` · Completed: ${m.actual_date}`}
                      </p>
                      <p className="text-xs text-muted-foreground">Last updated: {fmt(m.updated_at)}</p>
                      <ProgressBar value={m.progress} size="sm" className="mt-2 max-w-64" />
                    </div>
                    <span className="text-lg font-display font-bold shrink-0">{m.progress}%</span>
                  </div>
                  {milestoneSubs.length > 0 && (
                    <div className="mt-4 border-t pt-3 space-y-2">
                      {milestoneSubs.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium truncate">{s.title}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {s.completed_quantity}/{s.target_quantity} {s.unit}
                              </span>
                            </div>
                            <ProgressBar value={s.progress_pct} size="sm" className="mt-1" />
                          </div>
                          <span className="text-xs font-display font-bold shrink-0">{s.progress_pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "updates" && (
          <div className="space-y-3">
            {publishedProgress.length > 0 && (
              <>
                <h3 className="text-sm font-semibold mt-2">Work progress</h3>
                {publishedProgress.map((p: any) => {
                  const s = subs.find((x: any) => x.id === p.sub_milestone_id);
                  return (
                    <div key={p.id} className="metric-card">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{s?.title ?? "Progress update"}</span>
                          <StatusBadge status="approved" />
                        </div>
                        <span className="text-sm font-display font-bold">
                          +{p.quantity} {s?.unit ?? ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {p.report_date}{s && ` · ${s.completed_quantity}/${s.target_quantity} ${s.unit} total (${s.progress_pct}%)`}
                      </p>
                      {p.description && <p className="text-sm">{p.description}</p>}
                    </div>
                  );
                })}
              </>
            )}

            {lastReportUpdate && <p className="text-xs text-muted-foreground mt-3">Daily reports updated {fmt(lastReportUpdate)}</p>}
            {publishedReports.length === 0 && publishedProgress.length === 0 ? (
              <div className="metric-card text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <h3 className="font-display font-bold">No Published Updates Yet</h3>
                <p className="text-sm text-muted-foreground mt-1">Updates will appear here once approved by the project manager.</p>
              </div>
            ) : publishedReports.map((r) => (
              <div key={r.id} className="metric-card">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-sm">{r.report_date}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.reviewed_at && <span className="text-xs text-muted-foreground">Published {fmt(r.reviewed_at)}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{r.weather ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Workforce on site: {r.workforce_count}</p>
                {r.tasks_completed && r.tasks_completed.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-foreground mb-1">Work Completed</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
                      {r.tasks_completed.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


        {activeTab === "photos" && (
          <div className="space-y-3">
            {lastMediaUpdate && <p className="text-xs text-muted-foreground">Last updated {fmt(lastMediaUpdate)}</p>}
            <ClientPhotoGallery
              media={publishedMedia}
              subs={publishedSubs}
              milestones={publishedMilestones}
              progress={publishedProgress}
            />
          </div>
        )}

        <footer className="text-center py-6 border-t">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">BuildTrust</span> · Building Structures. Building Trust.
          </p>
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value, total, icon }: { label: string; value: number; total?: number; icon: React.ReactNode }) {
  return (
    <div className="metric-card flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-lg font-display font-bold">
          {value}{total ? <span className="text-muted-foreground text-sm font-normal">/{total}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
