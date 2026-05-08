import { Link } from "react-router-dom";
import {
  FolderKanban,
  AlertTriangle,
  CheckSquare,
  FileText,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useProjects, useReports } from "@/hooks/useBuildTrust";

export default function Dashboard() {
  const { data: projects = [], isLoading: pl } = useProjects();
  const { data: reports = [] } = useReports();

  const active = projects.filter((p) => p.status === "active").length;
  const delayed = projects.filter((p) => p.status === "delayed").length;
  const pending = reports.filter((r) => r.status === "submitted" || r.status === "under-review").length;
  const published = reports.filter((r) => r.status === "published" || r.status === "approved").length;
  const compliance = reports.length > 0 ? Math.round((published / reports.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all projects and activities</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Projects" value={active} icon={<FolderKanban className="h-5 w-5" />} subtitle={`${projects.length} total`} />
        <MetricCard title="Delayed" value={delayed} icon={<AlertTriangle className="h-5 w-5" />} subtitle="Needs attention" />
        <MetricCard title="Pending Approvals" value={pending} icon={<CheckSquare className="h-5 w-5" />} subtitle="Reports awaiting review" />
        <MetricCard title="Compliance Rate" value={`${compliance}%`} icon={<TrendingUp className="h-5 w-5" />} subtitle="Reporting on time" />
      </div>

      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Projects</h2>
          <Link to="/projects" className="text-sm text-primary font-medium hover:underline">View all →</Link>
        </div>
        {pl ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects yet. Create your first project from the Projects page.</p>
        ) : (
          <div className="space-y-4">
            {projects.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm truncate">{p.title}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{p.client_name ?? "—"} · {p.location ?? "—"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <ProgressBar value={p.completion} size="sm" className="flex-1 max-w-48" />
                    <span className="text-xs font-semibold">{p.completion}%</span>
                  </div>
                </div>
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{p.current_phase ?? "—"}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="metric-card">
        <h2 className="font-display font-bold text-lg mb-4">Recent Reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.report_date}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.weather ?? "—"} · {r.workforce_count} workers</p>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
