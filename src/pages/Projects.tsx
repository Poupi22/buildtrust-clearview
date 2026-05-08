import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useState } from "react";
import { useProjects } from "@/hooks/useBuildTrust";
import { NewProjectDialog } from "@/components/dialogs/NewProjectDialog";

export default function Projects() {
  const [search, setSearch] = useState("");
  const { data: projects = [], isLoading } = useProjects();

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} total projects</p>
        </div>
        <NewProjectDialog />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects or clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="metric-card text-center py-12">
          <p className="text-sm text-muted-foreground">No projects yet. Click "New Project" to create one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="metric-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">{p.code}</p>
                  <h3 className="font-display font-bold mt-0.5">{p.title}</h3>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <p className="text-sm text-muted-foreground">{p.client_name ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{p.location ?? "—"}</p>
              <div className="flex items-center gap-3 mt-4">
                <ProgressBar value={p.completion} size="sm" className="flex-1" />
                <span className="text-sm font-bold">{p.completion}%</span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-xs text-muted-foreground">{p.current_phase ?? "—"}</span>
                <span className="text-xs text-muted-foreground">{p.type ?? "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
