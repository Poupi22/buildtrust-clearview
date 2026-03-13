import { useState } from "react";
import {
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Camera,
  FileText,
  Download,
  Eye,
  Shield,
} from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { StatusBadge } from "@/components/StatusBadge";
import { projects, milestones, dailyReports } from "@/lib/mock-data";
import logo from "@/assets/logo.jpg";

// Simulate a client viewing project p1
const project = projects[0];

// Only show approved/published reports
const publishedReports = dailyReports.filter(
  (r) => r.status === "approved" || r.status === "published"
);

// Only show completed or in-progress milestones
const visibleMilestones = milestones.filter(
  (m) => m.status === "completed" || m.status === "in-progress"
);

type PortalTab = "overview" | "milestones" | "updates" | "photos";

const sitePhotos = [
  { id: "sp1", date: "2026-03-12", caption: "Block B – Level 2 column casting complete", category: "Superstructure" },
  { id: "sp2", date: "2026-03-11", caption: "Formwork installation progress", category: "Superstructure" },
  { id: "sp3", date: "2026-03-08", caption: "Reinforcement tying – Block A Level 3", category: "Superstructure" },
  { id: "sp4", date: "2026-03-05", caption: "Foundation inspection sign-off", category: "Foundation" },
  { id: "sp5", date: "2026-02-28", caption: "Site drainage maintenance completed", category: "Site Works" },
  { id: "sp6", date: "2026-02-20", caption: "Substructure – final pour complete", category: "Substructure" },
];

export default function ClientPortal() {
  const [activeTab, setActiveTab] = useState<PortalTab>("overview");

  const tabs: { key: PortalTab; label: string; icon: React.ElementType }[] = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "milestones", label: "Milestones", icon: CheckCircle2 },
    { key: "updates", label: "Updates", icon: FileText },
    { key: "photos", label: "Site Photos", icon: Camera },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Client portal header */}
      <header className="sticky top-0 z-40 border-b bg-card px-4 py-3 lg:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="BuildTrust" className="h-8 object-contain" />
            <div className="hidden sm:block h-6 w-px bg-border" />
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground font-medium">Client Portal</p>
              <p className="text-sm font-display font-bold">{project.clientName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-success" />
            <span className="hidden sm:inline">Verified & Approved Updates Only</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Project hero */}
        <div className="metric-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <p className="text-xs font-medium text-primary tracking-wide uppercase">{project.code}</p>
            <h1 className="text-xl lg:text-2xl font-display font-bold mt-1">{project.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {project.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {project.type}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Target: {project.plannedEndDate}
              </span>
            </div>

            {/* Big progress display */}
            <div className="mt-5 p-4 rounded-xl bg-muted/50 border">
              <div className="flex items-end justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Overall Completion</p>
                  <p className="text-3xl font-display font-bold text-primary">{project.completion}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Current Phase</p>
                  <p className="text-sm font-semibold">{project.currentPhase}</p>
                </div>
              </div>
              <ProgressBar value={project.completion} size="lg" />
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

        {activeTab === "overview" && <OverviewSection />}
        {activeTab === "milestones" && <MilestonesSection />}
        {activeTab === "updates" && <UpdatesSection />}
        {activeTab === "photos" && <PhotosSection />}

        {/* Footer */}
        <footer className="text-center py-6 border-t">
          <p className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold">BuildTrust</span> · Building Structures. Building Trust.
          </p>
        </footer>
      </div>
    </div>
  );
}

function OverviewSection() {
  const completedCount = milestones.filter((m) => m.status === "completed").length;
  const inProgressCount = milestones.filter((m) => m.status === "in-progress").length;

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Milestones Done" value={completedCount} total={milestones.length} icon={<CheckCircle2 className="h-5 w-5 text-success" />} />
        <StatCard label="In Progress" value={inProgressCount} icon={<Clock className="h-5 w-5 text-primary" />} />
        <StatCard label="Published Updates" value={publishedReports.length} icon={<FileText className="h-5 w-5 text-primary" />} />
        <StatCard label="Site Photos" value={sitePhotos.length} icon={<Camera className="h-5 w-5 text-accent" />} />
      </div>

      {/* Milestone timeline */}
      <div className="metric-card">
        <h3 className="font-display font-bold mb-4">Milestone Progress</h3>
        <div className="space-y-3">
          {visibleMilestones.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full shrink-0 ${m.status === "completed" ? "bg-success" : "bg-primary animate-pulse"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{m.title}</span>
                  <StatusBadge status={m.status} />
                </div>
                {m.actualDate && (
                  <p className="text-xs text-muted-foreground">Completed: {m.actualDate}</p>
                )}
              </div>
              <span className="text-sm font-display font-bold shrink-0">{m.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest update */}
      {publishedReports.length > 0 && (
        <div className="metric-card">
          <h3 className="font-display font-bold mb-3">Latest Approved Update</h3>
          <LatestReportCard report={publishedReports[0]} />
        </div>
      )}
    </div>
  );
}

function MilestonesSection() {
  return (
    <div className="space-y-3">
      {milestones.map((m) => {
        const isVisible = m.status === "completed" || m.status === "in-progress";
        return (
          <div
            key={m.id}
            className={`metric-card transition-opacity ${!isVisible ? "opacity-40" : ""}`}
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                m.status === "completed"
                  ? "bg-success/10 text-success"
                  : m.status === "in-progress"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}>
                {m.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-sm">{m.title}</span>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Planned: {m.plannedDate}
                  {m.actualDate && ` · Completed: ${m.actualDate}`}
                </p>
                {isVisible && <ProgressBar value={m.progress} size="sm" className="mt-2 max-w-64" />}
              </div>
              <span className="text-lg font-display font-bold shrink-0">{m.progress}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UpdatesSection() {
  if (publishedReports.length === 0) {
    return (
      <div className="metric-card text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="font-display font-bold">No Published Updates Yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Updates will appear here once approved by the project manager.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {publishedReports.map((r) => (
        <div key={r.id} className="metric-card">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm">{r.date}</span>
              <StatusBadge status={r.status} />
            </div>
            <button className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{r.author} · {r.weather}</p>
          <p className="text-sm text-muted-foreground">Workforce on site: {r.workforceCount}</p>
          <div className="mt-3">
            <p className="text-xs font-semibold text-foreground mb-1">Work Completed</p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-0.5">
              {r.tasksCompleted.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>
          {r.photoCount > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Camera className="h-3.5 w-3.5" />
              {r.photoCount} site photos attached
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PhotosSection() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {sitePhotos.map((photo) => (
          <div key={photo.id} className="metric-card p-0 overflow-hidden group cursor-pointer">
            <div className="aspect-[4/3] bg-muted flex items-center justify-center relative">
              <Camera className="h-8 w-8 text-muted-foreground/30" />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
                <Eye className="h-5 w-5 text-foreground/0 group-hover:text-foreground/50 transition-colors" />
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs font-medium truncate">{photo.caption}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">{photo.date}</span>
                <span className="text-xs text-primary font-medium">{photo.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Photos shown are from approved reports only. Connect storage for full media.
      </p>
    </div>
  );
}

function StatCard({ label, value, total, icon }: { label: string; value: number; total?: number; icon: React.ReactNode }) {
  return (
    <div className="metric-card flex items-center gap-3">
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-lg font-display font-bold">
          {value}{total ? <span className="text-muted-foreground text-sm font-normal">/{total}</span> : null}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function LatestReportCard({ report }: { report: typeof publishedReports[0] }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold">{report.date}</span>
        <StatusBadge status={report.status} />
      </div>
      <p className="text-sm text-muted-foreground">{report.author}</p>
      <ul className="text-sm text-muted-foreground list-disc list-inside mt-2">
        {report.tasksCompleted.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
