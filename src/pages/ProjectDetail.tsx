import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Camera, FileText, AlertTriangle, MapPin, Calendar, Users, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useState } from "react";
import {
  useProject, useMilestones, useReports, useIssues, useMedia,
  useUpdateMilestone, useDeleteMilestone, useToggleMediaPublish, getMediaUrl,
  useSubmitMilestoneForReview, useReviewMilestone,
} from "@/hooks/useBuildTrust";
import { NewReportDialog } from "@/components/dialogs/NewReportDialog";
import { NewIssueDialog } from "@/components/dialogs/NewIssueDialog";
import { NewMilestoneDialog } from "@/components/dialogs/NewMilestoneDialog";
import { UploadMediaDialog } from "@/components/dialogs/UploadMediaDialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type Tab = "overview" | "milestones" | "reports" | "issues" | "photos";

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id);
  const { data: milestones = [] } = useMilestones(id);
  const { data: reports = [] } = useReports(id);
  const { data: issues = [] } = useIssues(id);
  const { data: media = [] } = useMedia(id);
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const togglePublish = useToggleMediaPublish();
  const submitForReview = useSubmitMilestoneForReview();
  const reviewMilestone = useReviewMilestone();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!project) return (
    <div className="space-y-3">
      <Link to="/projects" className="text-sm text-primary hover:underline">← Back to projects</Link>
      <p className="text-sm text-muted-foreground">Project not found.</p>
    </div>
  );

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "milestones", label: "Milestones", icon: Calendar },
    { key: "reports", label: "Reports", icon: FileText },
    { key: "issues", label: "Issues", icon: AlertTriangle },
    { key: "photos", label: "Photos", icon: Camera },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-display font-bold truncate">{project.title}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground">{project.code}</p>
        </div>
      </div>

      <div className="metric-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium">{project.client_name ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium">{project.location ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="text-sm font-medium">{project.planned_end_date ?? "—"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Completion</p>
            <div className="flex items-center gap-2">
              <ProgressBar value={project.completion} size="md" className="flex-1" />
              <span className="text-sm font-bold">{project.completion}%</span>
            </div>
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
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="metric-card">
            <h3 className="font-display font-bold mb-3">Milestone Progress</h3>
            {milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones yet.</p>
            ) : (
              <div className="space-y-3">
                {milestones.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <StatusBadge status={m.status} />
                      <span className="text-sm truncate">{m.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{m.progress}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="metric-card">
            <h3 className="font-display font-bold mb-3">Recent Activity</h3>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet.</p>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{r.report_date}</p>
                      <p className="text-xs text-muted-foreground">{r.weather ?? "—"}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "milestones" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <NewMilestoneDialog projectId={project.id} nextOrder={milestones.length} />
          </div>
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet for this project.</p>
          ) : milestones.map((m: any) => (
            <div key={m.id} className="metric-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm">{m.title}</span>
                    <StatusBadge status={m.status} />
                    <StatusBadge status={m.review_status ?? "draft"} />
                    {m.is_published && <span className="text-xs text-primary">• Visible to client</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Planned: {m.planned_date ?? "—"} {m.actual_date && `· Actual: ${m.actual_date}`}
                  </p>
                  {m.review_comment && (
                    <p className="text-xs text-muted-foreground mt-1 italic">Reviewer: "{m.review_comment}"</p>
                  )}
                </div>
                <span className="text-lg font-display font-bold">{m.progress}%</span>
              </div>
              <Slider
                value={[m.progress]}
                disabled={m.review_status === "pending_review" || m.review_status === "approved"}
                max={100}
                step={5}
                onValueChange={(v) => {
                  const progress = v[0];
                  const status = progress >= 100 ? "completed" : progress > 0 ? "in-progress" : "pending";
                  updateMilestone.mutate({
                    id: m.id, project_id: project.id, progress, status: status as any,
                    actual_date: progress >= 100 ? new Date().toISOString().slice(0, 10) : null,
                  });
                }}
              />
              <div className="flex gap-2 mt-3 flex-wrap">
                {(m.review_status === "draft" || m.review_status === "rejected") && (
                  <Button size="sm" disabled={submitForReview.isPending} onClick={async () => {
                    try {
                      await submitForReview.mutateAsync({ id: m.id, project_id: project.id });
                      toast.success("Submitted for review");
                    } catch (e: any) { toast.error(e.message ?? "Failed to submit"); }
                  }}>
                    Submit for review
                  </Button>
                )}
                {m.review_status === "pending_review" && (
                  <>
                    <Button size="sm" onClick={async () => {
                      const c = prompt("Approval comment (optional)") ?? undefined;
                      try {
                        await reviewMilestone.mutateAsync({ id: m.id, project_id: project.id, decision: "approved", comment: c || undefined });
                        toast.success("Milestone approved & published");
                      } catch (e: any) { toast.error(e.message ?? "Failed"); }
                    }}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />Approve & publish
                    </Button>
                    <Button size="sm" variant="destructive" onClick={async () => {
                      const c = prompt("Reason for rejection") ?? undefined;
                      try {
                        await reviewMilestone.mutateAsync({ id: m.id, project_id: project.id, decision: "rejected", comment: c || undefined });
                        toast.success("Milestone rejected");
                      } catch (e: any) { toast.error(e.message ?? "Failed"); }
                    }}>Reject</Button>
                  </>
                )}
                {m.review_status === "approved" && (
                  <Button size="sm" variant="outline" onClick={() => updateMilestone.mutate({ id: m.id, project_id: project.id, is_published: !m.is_published })}>
                    {m.is_published ? <><EyeOff className="h-3 w-3 mr-1" />Unpublish</> : <><Eye className="h-3 w-3 mr-1" />Republish</>}
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => {
                  if (confirm("Delete milestone?")) deleteMilestone.mutate({ id: m.id, project_id: project.id });
                }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <NewReportDialog defaultProjectId={project.id} />
          </div>
          {reports.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reports yet.</p>
          ) : reports.map((r) => (
            <div key={r.id} className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{r.report_date}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.weather ?? "—"} · {r.workforce_count} workers</p>
              {r.tasks_completed && r.tasks_completed.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-foreground">Tasks completed:</p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {r.tasks_completed.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === "issues" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <NewIssueDialog defaultProjectId={project.id} />
          </div>
          {issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No issues reported.</p>
          ) : issues.map((iss) => (
            <div key={iss.id} className="metric-card">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={iss.severity} />
                <StatusBadge status={iss.status} />
                <span className="font-semibold text-sm">{iss.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">{iss.description ?? "—"}</p>
              <p className="text-xs text-muted-foreground mt-1">Impact: {iss.impact ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Identified: {iss.date_identified}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "photos" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <UploadMediaDialog projectId={project.id} />
          </div>
          {media.length === 0 ? (
            <div className="metric-card text-center py-12">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No photos yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {media.map((f: any) => (
                <div key={f.id} className="metric-card p-2 space-y-2">
                  {f.mime_type?.startsWith("image/") ? (
                    <img src={getMediaUrl(f.storage_path)} alt={f.caption ?? ""} className="w-full aspect-square object-cover rounded-lg" />
                  ) : (
                    <a href={getMediaUrl(f.storage_path)} target="_blank" rel="noreferrer" className="block aspect-square flex items-center justify-center bg-muted rounded-lg text-xs text-primary">
                      <FileText className="h-8 w-8" />
                    </a>
                  )}
                  {f.caption && <p className="text-xs truncate">{f.caption}</p>}
                  <Button
                    size="sm"
                    variant={f.is_published ? "default" : "outline"}
                    className="w-full"
                    onClick={() => togglePublish.mutate({ id: f.id, project_id: project.id, is_published: !f.is_published })}
                  >
                    {f.is_published ? <><CheckCircle2 className="h-3 w-3 mr-1" />Published</> : "Publish"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
