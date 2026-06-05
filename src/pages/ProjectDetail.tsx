import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Camera, FileText, AlertTriangle, MapPin, Calendar, Users, Eye, EyeOff, CheckCircle2, ChevronDown, ChevronRight, Trash2, MoreHorizontal, Send, XCircle, Plus, ClipboardList } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useState } from "react";
import {
  useProject, useMilestones, useReports, useIssues, useMedia,
  useUpdateMilestone, useDeleteMilestone, useToggleMediaPublish, getMediaUrl,
  useSubmitMilestoneForReview, useReviewMilestone,
  useSubMilestones, useDeleteSubMilestone,
  useProgressReports, useReviewProgressReport, useDeleteProgressReport,
  useProjectMembers, useUpdateMediaCaption,
} from "@/hooks/useBuildTrust";
import { useAuth } from "@/contexts/AuthContext";
import { NewReportDialog } from "@/components/dialogs/NewReportDialog";
import { NewIssueDialog } from "@/components/dialogs/NewIssueDialog";
import { NewMilestoneDialog } from "@/components/dialogs/NewMilestoneDialog";
import { NewSubMilestoneDialog } from "@/components/dialogs/NewSubMilestoneDialog";
import { SubmitProgressReportDialog } from "@/components/dialogs/SubmitProgressReportDialog";
import { UploadMediaDialog } from "@/components/dialogs/UploadMediaDialog";
import { MilestoneCsvIO } from "@/components/MilestoneCsvIO";
import { InviteClientDialog } from "@/components/dialogs/InviteClientDialog";
import { AssignTaskDialog } from "@/components/dialogs/AssignTaskDialog";
import { ProjectTasksPanel } from "@/components/ProjectTasksPanel";
import { ProgressReportDetailsDialog } from "@/components/dialogs/ProgressReportDetailsDialog";
import { EditProjectDialog } from "@/components/dialogs/EditProjectDialog";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Tab = "overview" | "milestones" | "reports" | "issues" | "photos";

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id);
  const { data: milestones = [] } = useMilestones(id);
  const { data: allSubs = [] } = useSubMilestones(id);
  const { data: reports = [] } = useReports(id);
  const { data: issues = [] } = useIssues(id);
  const { data: media = [] } = useMedia(id);
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const togglePublish = useToggleMediaPublish();
  const submitForReview = useSubmitMilestoneForReview();
  const reviewMilestone = useReviewMilestone();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { user, role: appRole } = useAuth();
  const { data: members = [] } = useProjectMembers(id);
  const myMembership = (members as any[]).find((m) => m.user_id === user?.id);
  const isAdmin = appRole === "super-admin" || appRole === "company-admin";
  const canManageMilestones = isAdmin || myMembership?.role === "manager" || myMembership?.role === "engineer";

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
        {isAdmin && <EditProjectDialog project={project} />}
        <AssignTaskDialog projectId={project.id} />
        <InviteClientDialog projectId={project.id} projectTitle={project.title} />



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
        <>
        <ProjectTasksPanel projectId={project.id} canManage={true} />
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
        </>
      )}


      {activeTab === "milestones" && (
        <div className="space-y-3">
          {canManageMilestones && (
            <div className="flex justify-end gap-2 flex-wrap">
              <MilestoneCsvIO
                projectId={project.id}
                projectCode={project.code}
                milestones={milestones}
                getSubs={(mid) => (allSubs as any[]).filter((s) => s.milestone_id === mid)}
              />
              <NewMilestoneDialog projectId={project.id} nextOrder={milestones.length} />
            </div>
          )}
          {milestones.length === 0 ? (
            <p className="text-sm text-muted-foreground">No milestones yet for this project.</p>
          ) : milestones.map((m: any) => (
            <MilestoneCard
              key={m.id}
              m={m}
              projectId={project.id}
              onSubmitForReview={async () => {
                try { await submitForReview.mutateAsync({ id: m.id, project_id: project.id }); toast.success("Submitted for review"); }
                catch (e: any) { toast.error(e.message ?? "Failed"); }
              }}
              onApprove={async () => {
                const c = prompt("Approval comment (optional)") ?? undefined;
                try { await reviewMilestone.mutateAsync({ id: m.id, project_id: project.id, decision: "approved", comment: c || undefined }); toast.success("Milestone approved & published"); }
                catch (e: any) { toast.error(e.message ?? "Failed"); }
              }}
              onReject={async () => {
                const c = prompt("Reason for rejection") ?? undefined;
                try { await reviewMilestone.mutateAsync({ id: m.id, project_id: project.id, decision: "rejected", comment: c || undefined }); toast.success("Milestone rejected"); }
                catch (e: any) { toast.error(e.message ?? "Failed"); }
              }}
              onTogglePublish={() => updateMilestone.mutate({ id: m.id, project_id: project.id, is_published: !m.is_published })}
              onDelete={() => { if (confirm("Delete milestone?")) deleteMilestone.mutate({ id: m.id, project_id: project.id }); }}
            />
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
                <MediaCard
                  key={f.id}
                  f={f}
                  projectId={project.id}
                  canEdit={isAdmin}
                  onTogglePublish={() => togglePublish.mutate({ id: f.id, project_id: project.id, is_published: !f.is_published })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MilestoneCard({ m, projectId, onSubmitForReview, onApprove, onReject, onTogglePublish, onDelete }: {
  m: any; projectId: string;
  onSubmitForReview: () => void; onApprove: () => void; onReject: () => void;
  onTogglePublish: () => void; onDelete: () => void;
}) {
  const [open, setOpen] = useState(true);
  const { data: subs = [] } = useSubMilestones(projectId, m.id);
  const delSub = useDeleteSubMilestone();
  const subContribTotal = subs.reduce((s, x: any) => s + Number(x.contribution_pct ?? 0), 0);

  const reviewStatus = m.review_status ?? "draft";
  const accentBar =
    reviewStatus === "approved" ? "bg-success" :
    reviewStatus === "pending_review" ? "bg-primary" :
    reviewStatus === "rejected" ? "bg-destructive" : "bg-muted-foreground/40";

  return (
    <div className="group rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Header */}
      <div className="relative p-5">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`} />
        <div className="flex items-start gap-3">
          <button
            onClick={() => setOpen(!open)}
            className="mt-0.5 p-1 -ml-1 rounded hover:bg-muted text-muted-foreground"
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-base leading-tight">{m.title}</h3>
              <StatusBadge status={reviewStatus} />
              {m.is_published && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
                  <Eye className="h-3 w-3" /> Client
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{m.planned_date ?? "—"}</span>
              <span>·</span>
              <span>{m.contribution_pct ?? 0}% of project</span>
              {subs.length > 0 && <><span>·</span><span>{subs.length} sub-milestone{subs.length > 1 ? "s" : ""}</span></>}
            </div>
            {m.review_comment && (
              <p className="mt-1.5 text-xs text-muted-foreground italic line-clamp-1">
                Reviewer: "{m.review_comment}"
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <CircularProgress value={m.progress} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-popover">
                {(reviewStatus === "draft" || reviewStatus === "rejected") && (
                  <DropdownMenuItem onClick={onSubmitForReview}>
                    <Send className="h-4 w-4 mr-2" />Submit for review
                  </DropdownMenuItem>
                )}
                {reviewStatus === "pending_review" && (
                  <>
                    <DropdownMenuItem onClick={onApprove}>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-success" />Approve & publish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onReject} className="text-destructive">
                      <XCircle className="h-4 w-4 mr-2" />Reject
                    </DropdownMenuItem>
                  </>
                )}
                {reviewStatus === "approved" && (
                  <DropdownMenuItem onClick={onTogglePublish}>
                    {m.is_published ? <><EyeOff className="h-4 w-4 mr-2" />Unpublish</> : <><Eye className="h-4 w-4 mr-2" />Republish</>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />Delete milestone
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>


      {/* Sub-milestones */}
      {open && (
        <div className="border-t bg-muted/30 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs">
              <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">Work packages</span>
              <span className={`tabular-nums ${subContribTotal === 100 ? "text-success" : "text-muted-foreground"}`}>
                · {subContribTotal}% allocated
              </span>
            </div>
            <NewSubMilestoneDialog projectId={projectId} milestoneId={m.id} />
          </div>
          {subs.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg bg-background">
              No work packages yet. Add the first one to start tracking progress.
            </div>
          ) : (
            <div className="space-y-2">
              {subs.map((s: any) => (
                <SubMilestoneRow key={s.id} s={s} projectId={projectId} onDelete={() => {
                  if (confirm("Delete sub-milestone? Approved progress will be removed.")) delSub.mutate(s.id);
                }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubMilestoneRow({ s, projectId, onDelete }: { s: any; projectId: string; onDelete: () => void }) {
  const [showReports, setShowReports] = useState(false);
  const [viewReport, setViewReport] = useState<any | null>(null);
  const { data: reports = [] } = useProgressReports({ projectId, subMilestoneId: s.id });
  const review = useReviewProgressReport();
  const delReport = useDeleteProgressReport();
  const pending = reports.filter((r: any) => r.status === "submitted").length;
  const remaining = Math.max(0, Number(s.target_quantity ?? 0) - Number(s.completed_quantity ?? 0));

  const decide = async (id: string, decision: "approved" | "rejected") => {
    const comment = decision === "rejected" ? (prompt("Reason for rejection") ?? undefined) : undefined;
    try {
      await review.mutateAsync({ id, decision, comment, publish: true });
      toast.success(decision === "approved" ? "Approved · progress updated" : "Rejected");
      setViewReport(null);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="rounded-lg border bg-card hover:border-primary/30 transition-colors">
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">{s.title}</span>
              <span className="text-[11px] text-muted-foreground">{s.contribution_pct}% of milestone</span>
              {pending > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                  {pending} pending
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <ProgressBar value={s.progress_pct} size="sm" className="flex-1" />
              <span className="text-xs font-semibold tabular-nums w-12 text-right">{Math.round(s.progress_pct)}%</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground tabular-nums">
              <span><span className="font-medium text-foreground">{s.completed_quantity}</span> / {s.target_quantity} {s.unit}</span>
              <span>·</span>
              <span>{remaining} {s.unit} remaining</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <SubmitProgressReportDialog projectId={projectId} sub={s} />
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowReports(!showReports)}>
              {showReports ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
              <span className="text-xs">{reports.length}</span>
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {showReports && (
        <div className="border-t bg-muted/40 px-3 py-2 space-y-1.5">
          {reports.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2 text-center">No progress reports yet.</p>
          ) : reports.map((r: any) => (
            <div key={r.id} className="rounded-md border bg-background p-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={r.status} />
                <span className="font-semibold tabular-nums">{r.quantity} {s.unit}</span>
                <span className="text-muted-foreground">· {r.report_date}</span>
                {r.is_published && <span className="text-success text-[10px]">· visible to client</span>}
              </div>
              {r.description && <p className="text-muted-foreground mt-1">{r.description}</p>}
              {r.review_comment && <p className="italic text-muted-foreground mt-1">Reviewer: "{r.review_comment}"</p>}
              <div className="flex gap-2 pt-1.5 flex-wrap">
                <Button size="sm" variant="outline" className="h-7" onClick={() => setViewReport(r)}>
                  <Eye className="h-3 w-3 mr-1" />View details
                </Button>
                {r.status === "submitted" && (
                  <>
                    <Button size="sm" className="h-7" onClick={() => decide(r.id, "approved")} disabled={review.isPending}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7" onClick={() => decide(r.id, "rejected")} disabled={review.isPending}>
                      Reject
                    </Button>
                  </>
                )}
                {r.status === "rejected" && (
                  <Button size="sm" variant="ghost" className="h-7 text-destructive"
                    onClick={() => { if (confirm("Delete this rejected report?")) delReport.mutate(r.id); }}>
                    <Trash2 className="h-3 w-3 mr-1" />Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ProgressReportDetailsDialog
        open={!!viewReport}
        onOpenChange={(o) => !o && setViewReport(null)}
        report={viewReport}
        sub={s}
        actionsDisabled={review.isPending}
        onApprove={viewReport?.status === "submitted" ? () => decide(viewReport.id, "approved") : undefined}
        onReject={viewReport?.status === "submitted" ? () => decide(viewReport.id, "rejected") : undefined}
      />
    </div>
  );
}

function CircularProgress({ value, size = 56 }: { value: number; size?: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  const color =
    clamped >= 75 ? "hsl(var(--success))" :
    clamped >= 40 ? "hsl(var(--primary))" :
    clamped >= 20 ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold tabular-nums">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

function MediaCard({ f, projectId, canEdit, onTogglePublish }: {
  f: any; projectId: string; canEdit: boolean; onTogglePublish: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(f.caption ?? "");
  const updateCaption = useUpdateMediaCaption();

  const save = async () => {
    const trimmed = title.trim();
    if (!trimmed) { toast.error("Title cannot be empty"); return; }
    try {
      await updateCaption.mutateAsync({ id: f.id, project_id: projectId, caption: trimmed });
      toast.success("Title updated");
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div className="metric-card p-2 space-y-2">
      {f.mime_type?.startsWith("image/") ? (
        <img src={getMediaUrl(f.storage_path)} alt={f.caption ?? ""} className="w-full aspect-square object-cover rounded-lg" />
      ) : (
        <a href={getMediaUrl(f.storage_path)} target="_blank" rel="noreferrer" className="block aspect-square flex items-center justify-center bg-muted rounded-lg text-xs text-primary">
          <FileText className="h-8 w-8" />
        </a>
      )}
      {editing ? (
        <div className="space-y-1">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setEditing(false); setTitle(f.caption ?? ""); } }}
            className="w-full text-xs rounded border px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-1">
            <Button size="sm" variant="default" className="h-7 flex-1 text-xs" onClick={save} disabled={updateCaption.isPending}>Save</Button>
            <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => { setEditing(false); setTitle(f.caption ?? ""); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => canEdit && setEditing(true)}
          disabled={!canEdit}
          title={canEdit ? "Click to rename" : undefined}
          className={`w-full text-left text-xs truncate ${canEdit ? "hover:text-primary cursor-text" : ""}`}
        >
          {f.caption || <span className="italic text-muted-foreground">Untitled</span>}
        </button>
      )}
      <Button
        size="sm"
        variant={f.is_published ? "default" : "outline"}
        className="w-full"
        onClick={onTogglePublish}
      >
        {f.is_published ? <><CheckCircle2 className="h-3 w-3 mr-1" />Published</> : "Publish"}
      </Button>
    </div>
  );
}



