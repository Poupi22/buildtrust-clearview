import { StatusBadge } from "@/components/StatusBadge";
import { FileText } from "lucide-react";
import { useReports } from "@/hooks/useBuildTrust";
import { NewReportDialog } from "@/components/dialogs/NewReportDialog";

export default function Reports() {
  const { data: reports = [], isLoading } = useReports();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Daily and weekly site reports</p>
        </div>
        <NewReportDialog />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : reports.length === 0 ? (
        <div className="metric-card text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No reports yet. Click "New Report" to create your first one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="metric-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Daily Report - {r.report_date}</span>
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.weather ?? "—"} · {r.workforce_count} workers</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>{r.tasks_completed?.length ?? 0} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
