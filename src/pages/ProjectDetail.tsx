import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Camera, FileText, AlertTriangle, MapPin, Calendar, Users } from "lucide-react";
import { projects, milestones, dailyReports, issues } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useState } from "react";

type Tab = "overview" | "milestones" | "reports" | "issues" | "photos";

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projects.find((p) => p.id === id) || projects[0];
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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

      {/* Project info bar */}
      <div className="metric-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Client</p>
              <p className="text-sm font-medium">{project.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-medium">{project.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Deadline</p>
              <p className="text-sm font-medium">{project.plannedEndDate}</p>
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

      {/* Tabs */}
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

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "milestones" && <MilestonesTab />}
      {activeTab === "reports" && <ReportsTab />}
      {activeTab === "issues" && <IssuesTab />}
      {activeTab === "photos" && <PhotosTab />}
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="metric-card">
        <h3 className="font-display font-bold mb-3">Milestone Progress</h3>
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
      </div>
      <div className="metric-card">
        <h3 className="font-display font-bold mb-3">Recent Activity</h3>
        <div className="space-y-3">
          {dailyReports.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
              <div>
                <p className="text-sm font-medium">{r.date}</p>
                <p className="text-xs text-muted-foreground">{r.author}</p>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MilestonesTab() {
  return (
    <div className="space-y-3">
      {milestones.map((m) => (
        <div key={m.id} className="metric-card flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">{m.title}</span>
              <StatusBadge status={m.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Planned: {m.plannedDate} {m.actualDate && `· Actual: ${m.actualDate}`}
            </p>
            <ProgressBar value={m.progress} size="sm" className="mt-2 max-w-64" />
          </div>
          <span className="text-lg font-display font-bold">{m.progress}%</span>
        </div>
      ))}
    </div>
  );
}

function ReportsTab() {
  return (
    <div className="space-y-3">
      {dailyReports.map((r) => (
        <div key={r.id} className="metric-card">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{r.date}</span>
              <StatusBadge status={r.status} />
            </div>
            <span className="text-xs text-muted-foreground">{r.photoCount} photos</span>
          </div>
          <p className="text-sm text-muted-foreground">{r.author} · {r.weather}</p>
          <p className="text-sm text-muted-foreground">Workforce: {r.workforceCount}</p>
          <div className="mt-2">
            <p className="text-xs font-medium text-foreground">Tasks completed:</p>
            <ul className="text-xs text-muted-foreground list-disc list-inside">
              {r.tasksCompleted.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
          {r.issues.length > 0 && (
            <div className="mt-2 p-2 rounded bg-destructive/5 border border-destructive/10">
              <p className="text-xs font-medium text-destructive">Issues:</p>
              <ul className="text-xs text-destructive/80 list-disc list-inside">
                {r.issues.map((iss, i) => <li key={i}>{iss}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IssuesTab() {
  return (
    <div className="space-y-3">
      {issues.map((iss) => (
        <div key={iss.id} className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={iss.severity} />
            <StatusBadge status={iss.status} />
            <span className="font-semibold text-sm">{iss.title}</span>
          </div>
          <p className="text-sm text-muted-foreground">{iss.description}</p>
          <p className="text-xs text-muted-foreground mt-1">Impact: {iss.impact}</p>
          <p className="text-xs text-muted-foreground">Identified: {iss.dateIdentified}</p>
        </div>
      ))}
    </div>
  );
}

function PhotosTab() {
  return (
    <div className="metric-card text-center py-12">
      <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
      <h3 className="font-display font-bold">Site Photos</h3>
      <p className="text-sm text-muted-foreground mt-1">Photos will be available once connected to storage</p>
      <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
        <Camera className="h-4 w-4" />
        Upload Photos
      </button>
    </div>
  );
}
