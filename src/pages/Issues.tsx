import { issues } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, AlertTriangle } from "lucide-react";

export default function Issues() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Issues & Risks</h1>
          <p className="text-muted-foreground text-sm mt-1">Track delays, risks, and corrective actions</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Report Issue</span>
        </button>
      </div>

      <div className="space-y-3">
        {issues.map((iss) => (
          <div key={iss.id} className="metric-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className={`h-4 w-4 ${iss.severity === "high" || iss.severity === "critical" ? "text-destructive" : "text-accent"}`} />
              <span className="font-semibold text-sm flex-1">{iss.title}</span>
              <StatusBadge status={iss.severity} />
              <StatusBadge status={iss.status} />
            </div>
            <p className="text-sm text-muted-foreground">{iss.description}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Impact: {iss.impact}</span>
              <span className="text-xs text-muted-foreground">{iss.dateIdentified}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
