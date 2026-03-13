import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { projects } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { useState } from "react";

export default function Projects() {
  const [search, setSearch] = useState("");
  const filtered = projects.filter(
    (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">{projects.length} total projects</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Project</span>
        </button>
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
            <p className="text-sm text-muted-foreground">{p.clientName}</p>
            <p className="text-xs text-muted-foreground">{p.location}</p>
            <div className="flex items-center gap-3 mt-4">
              <ProgressBar value={p.completion} size="sm" className="flex-1" />
              <span className="text-sm font-bold">{p.completion}%</span>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className="text-xs text-muted-foreground">{p.currentPhase}</span>
              <span className="text-xs text-muted-foreground">{p.teamCount} members</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
