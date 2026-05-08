import { StatusBadge } from "@/components/StatusBadge";
import { AlertTriangle } from "lucide-react";
import { useIssues } from "@/hooks/useBuildTrust";
import { NewIssueDialog } from "@/components/dialogs/NewIssueDialog";

export default function Issues() {
  const { data: issues = [], isLoading } = useIssues();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Issues & Risks</h1>
          <p className="text-muted-foreground text-sm mt-1">Track delays, risks, and corrective actions</p>
        </div>
        <NewIssueDialog />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : issues.length === 0 ? (
        <div className="metric-card text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No issues reported.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((iss) => (
            <div key={iss.id} className="metric-card">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-4 w-4 ${iss.severity === "high" || iss.severity === "critical" ? "text-destructive" : "text-accent"}`} />
                <span className="font-semibold text-sm flex-1">{iss.title}</span>
                <StatusBadge status={iss.severity} />
                <StatusBadge status={iss.status} />
              </div>
              <p className="text-sm text-muted-foreground">{iss.description ?? "—"}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Impact: {iss.impact ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{iss.date_identified}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
