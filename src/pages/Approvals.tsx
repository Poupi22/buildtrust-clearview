import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckSquare, Flag, FileText, ClipboardCheck, Eye } from "lucide-react";
import { useReports, useReviewReport, useMilestones, useReviewMilestone, useProgressReports, useReviewProgressReport, useSubMilestones } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProgressReportDetailsDialog } from "@/components/dialogs/ProgressReportDetailsDialog";

export default function Approvals() {
  const { data: reports = [], isLoading } = useReports();
  const { data: milestones = [] } = useMilestones();
  const { data: progress = [] } = useProgressReports();
  const { data: subs = [] } = useSubMilestones(undefined);
  const reviewReport = useReviewReport();
  const reviewMilestone = useReviewMilestone();
  const reviewProgress = useReviewProgressReport();
  const [viewProgress, setViewProgress] = useState<any | null>(null);

  const pendingReports = reports.filter((r) => r.status === "submitted" || r.status === "under-review");
  const pendingMilestones = milestones.filter((m: any) => m.review_status === "pending_review");
  const pendingProgress = progress.filter((p: any) => p.status === "submitted");
  const totalPending = pendingReports.length + pendingMilestones.length + pendingProgress.length;

  const subById = (id: string) => subs.find((s: any) => s.id === id);

  const decideReport = async (id: string, project_id: string, decision: "approved" | "rejected") => {
    try {
      await reviewReport.mutateAsync({ id, project_id, decision });
      toast.success(decision === "approved" ? "Report published to client" : "Report rejected");
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  const decideMilestone = async (id: string, project_id: string, decision: "approved" | "rejected") => {
    const comment = prompt(decision === "approved" ? "Approval comment (optional)" : "Reason for rejection") ?? undefined;
    try {
      await reviewMilestone.mutateAsync({ id, project_id, decision, comment: comment || undefined });
      toast.success(decision === "approved" ? "Milestone approved & published" : "Milestone rejected");
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  const decideProgress = async (id: string, decision: "approved" | "rejected") => {
    const comment = decision === "rejected" ? (prompt("Reason for rejection") ?? undefined) : undefined;
    try {
      await reviewProgress.mutateAsync({ id, decision, comment, publish: true });
      toast.success(decision === "approved" ? "Progress approved & counted" : "Progress rejected");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {totalPending} item{totalPending === 1 ? "" : "s"} pending review
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : totalPending === 0 ? (
        <div className="metric-card text-center py-12">
          <CheckSquare className="h-12 w-12 mx-auto text-success/50 mb-3" />
          <h3 className="font-display font-bold">All caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingMilestones.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Flag className="h-4 w-4 text-primary" /> Milestones ({pendingMilestones.length})
              </h2>
              {pendingMilestones.map((m: any) => (
                <div key={m.id} className="metric-card">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{m.title}</span>
                      <StatusBadge status={m.status} />
                      <StatusBadge status="pending_review" />
                    </div>
                    <span className="text-sm font-display font-bold">{m.progress}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Planned: {m.planned_date ?? "—"}{m.actual_date && ` · Actual: ${m.actual_date}`}
                  </p>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => decideMilestone(m.id, m.project_id, "approved")} disabled={reviewMilestone.isPending}>
                      Approve & Publish
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => decideMilestone(m.id, m.project_id, "rejected")} disabled={reviewMilestone.isPending}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {pendingProgress.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" /> Progress Reports ({pendingProgress.length})
              </h2>
              {pendingProgress.map((p: any) => {
                const s = subById(p.sub_milestone_id);
                return (
                  <div key={p.id} className="metric-card">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{s?.title ?? "Sub-milestone"}</span>
                        <StatusBadge status={p.status} />
                      </div>
                      <span className="text-sm font-display font-bold">
                        +{p.quantity} {s?.unit ?? ""}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {p.report_date}{s && ` · Currently ${s.completed_quantity}/${s.target_quantity} ${s.unit} (${s.progress_pct}%)`}
                    </p>
                    {p.description && <p className="text-sm mb-3">{p.description}</p>}
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" className="flex-1" onClick={() => setViewProgress(p)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> View details
                      </Button>
                      <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => decideProgress(p.id, "approved")} disabled={reviewProgress.isPending}>
                        Approve & Count
                      </Button>
                      <Button variant="destructive" className="flex-1"
                        onClick={() => decideProgress(p.id, "rejected")} disabled={reviewProgress.isPending}>
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </section>
          )}


          {pendingReports.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Daily Reports ({pendingReports.length})
              </h2>
              {pendingReports.map((r) => (
                <div key={r.id} className="metric-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.report_date}</span>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{r.weather ?? "—"} · {r.workforce_count} workers</p>
                  {r.tasks_completed && r.tasks_completed.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc list-inside mb-3">
                      {r.tasks_completed.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-success hover:bg-success/90 text-success-foreground" onClick={() => decideReport(r.id, r.project_id, "approved")} disabled={reviewReport.isPending}>
                      Approve & Publish
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => decideReport(r.id, r.project_id, "rejected")} disabled={reviewReport.isPending}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
