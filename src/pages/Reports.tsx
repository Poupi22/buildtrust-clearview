import { dailyReports } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, FileText } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Daily and weekly site reports</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Report</span>
        </button>
      </div>

      <div className="space-y-3">
        {dailyReports.map((r) => (
          <div key={r.id} className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">Daily Report - {r.date}</span>
                <StatusBadge status={r.status} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{r.author} · {r.weather} · {r.workforceCount} workers</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{r.tasksCompleted.length} tasks</span>
              <span>{r.photoCount} photos</span>
              {r.issues.length > 0 && <span className="text-destructive">{r.issues.length} issues</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
