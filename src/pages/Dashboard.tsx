import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  AlertTriangle,
  CheckSquare,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { dashboardMetrics, projects, dailyReports } from "@/lib/mock-data";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all projects and activities</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Active Projects" value={dashboardMetrics.activeProjects} icon={<FolderKanban className="h-5 w-5" />} subtitle={`${dashboardMetrics.totalProjects} total`} />
        <MetricCard title="Delayed" value={dashboardMetrics.delayedProjects} icon={<AlertTriangle className="h-5 w-5" />} subtitle="Needs attention" />
        <MetricCard title="Pending Approvals" value={dashboardMetrics.pendingApprovals} icon={<CheckSquare className="h-5 w-5" />} subtitle="Reports awaiting review" />
        <MetricCard title="Compliance Rate" value={`${dashboardMetrics.complianceRate}%`} icon={<TrendingUp className="h-5 w-5" />} subtitle="Reporting on time" />
      </div>

      {/* Projects overview */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">Active Projects</h2>
          <Link to="/projects" className="text-sm text-primary font-medium hover:underline">View all →</Link>
        </div>
        <div className="space-y-4">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm truncate">{p.title}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-muted-foreground">{p.clientName} · {p.location}</p>
                <div className="flex items-center gap-2 mt-2">
                  <ProgressBar value={p.completion} size="sm" className="flex-1 max-w-48" />
                  <span className="text-xs font-semibold">{p.completion}%</span>
                </div>
              </div>
              <div className="hidden sm:block text-right shrink-0">
                <p className="text-xs text-muted-foreground">{p.currentPhase}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{p.teamCount} team</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent reports */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="metric-card">
          <h2 className="font-display font-bold text-lg mb-4">Recent Reports</h2>
          <div className="space-y-3">
            {dailyReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{r.date}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.author} · {r.photoCount} photos</p>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card">
          <h2 className="font-display font-bold text-lg mb-4">Milestones Progress</h2>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <div className="text-4xl font-display font-bold text-primary">
                {dashboardMetrics.completedMilestones}/{dashboardMetrics.totalMilestones}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Milestones completed across all projects</p>
              <ProgressBar value={(dashboardMetrics.completedMilestones / dashboardMetrics.totalMilestones) * 100} size="lg" className="mt-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
