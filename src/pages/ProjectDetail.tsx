import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Camera, FileText, AlertTriangle, MapPin, Calendar, Users } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useState } from "react";
import { useProject, useMilestones, useReports, useIssues } from "@/hooks/useBuildTrust";
import { NewReportDialog } from "@/components/dialogs/NewReportDialog";
import { NewIssueDialog } from "@/components/dialogs/NewIssueDialog";

type Tab = "overview" | "milestones" | "reports" | "issues" | "photos";

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading } = useProject(id);
  const { data: milestones = [] } = useMilestones(id);
  const { data: reports = [] } = useReports(id);
  const { data: issues = [] } = useIssues(id);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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
      )}

      {activeTab === "milestones" && (
        milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground">No milestones yet for this project.</p>
        ) : (
          <div className="space-y-3">
            {milestones.map((m) => (
              <div key={m.id} className="metric-card flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{m.title}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Planned: {m.planned_date ?? "—"} {m.actual_date && `· Actual: ${m.actual_date}`}
                  </p>
                  <ProgressBar value={m.progress} size="sm" className="mt-2 max-w-64" />
                </div>
                <span className="text-lg font-display font-bold">{m.progress}%</span>
              </div>
            ))}
          </div>
        )
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
        <div className="metric-card text-center py-12">
          <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-display font-bold">Site Photos</h3>
          <p className="text-sm text-muted-foreground mt-1">Photo uploads coming in the next iteration.</p>
        </div>
      )}
    </div>
  );
}
