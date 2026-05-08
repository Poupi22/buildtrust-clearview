import { StatusBadge } from "@/components/StatusBadge";
import { CheckSquare } from "lucide-react";
import { useReports, useReviewReport } from "@/hooks/useBuildTrust";
import { toast } from "sonner";

export default function Approvals() {
  const { data: reports = [], isLoading } = useReports();
  const review = useReviewReport();
  const pending = reports.filter((r) => r.status === "submitted" || r.status === "under-review");

  const decide = async (id: string, project_id: string, decision: "approved" | "rejected") => {
    try {
      await review.mutateAsync({ id, project_id, decision });
      toast.success(decision === "approved" ? "Report published to client" : "Report rejected");
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">{pending.length} reports pending review</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : pending.length === 0 ? (
        <div className="metric-card text-center py-12">
          <CheckSquare className="h-12 w-12 mx-auto text-success/50 mb-3" />
          <h3 className="font-display font-bold">All caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((r) => (
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
                <button
                  onClick={() => decide(r.id, r.project_id, "approved")}
                  disabled={review.isPending}
                  className="flex-1 rounded-lg bg-success py-2 text-sm font-semibold text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
                >
                  Approve & Publish
                </button>
                <button
                  onClick={() => decide(r.id, r.project_id, "rejected")}
                  disabled={review.isPending}
                  className="flex-1 rounded-lg bg-destructive py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
