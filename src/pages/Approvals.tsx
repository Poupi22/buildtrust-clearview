import { dailyReports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckSquare } from "lucide-react";

export default function Approvals() {
  const pending = dailyReports.filter((r) => r.status === "submitted" || r.status === "under-review");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Approvals</h1>
        <p className="text-muted-foreground text-sm mt-1">{pending.length} reports pending review</p>
      </div>

      {pending.length === 0 ? (
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
                  <span className="font-semibold">{r.date}</span>
                  <StatusBadge status={r.status} />
                </div>
                <span className="text-xs text-muted-foreground">{r.photoCount} photos</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{r.author}</p>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-success py-2 text-sm font-semibold text-success-foreground hover:bg-success/90 transition-colors">
                  Approve
                </button>
                <button className="flex-1 rounded-lg bg-destructive py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors">
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
