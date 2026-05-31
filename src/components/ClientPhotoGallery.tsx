import { useMemo, useState } from "react";
import { Camera, Download, FileText, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMediaUrl } from "@/hooks/useBuildTrust";

type Media = any;
type Sub = any;
type Milestone = any;
type Progress = any;

interface Props {
  media: Media[];
  subs: Sub[];
  milestones: Milestone[];
  progress: Progress[];
}

const DATE_FILTERS = [
  { v: "all", label: "All time" },
  { v: "7", label: "Last 7 days" },
  { v: "30", label: "Last 30 days" },
  { v: "90", label: "Last 90 days" },
];

export function ClientPhotoGallery({ media, subs, milestones, progress }: Props) {
  const [milestoneId, setMilestoneId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState<Media | null>(null);

  const subById = useMemo(() => new Map(subs.map((s) => [s.id, s])), [subs]);
  const milestoneById = useMemo(
    () => new Map(milestones.map((m) => [m.id, m])),
    [milestones],
  );
  const progressById = useMemo(
    () => new Map(progress.map((p) => [p.id, p])),
    [progress],
  );

  const enriched = useMemo(() => {
    return media.map((f) => {
      const pr = f.progress_report_id ? progressById.get(f.progress_report_id) : null;
      const sub = pr ? subById.get(pr.sub_milestone_id) : null;
      const milestone = sub ? milestoneById.get(sub.milestone_id) : null;
      const reportDate: string = pr?.report_date ?? f.created_at?.slice(0, 10) ?? "—";
      return {
        ...f,
        _milestoneId: milestone?.id ?? "__unlinked__",
        _milestoneTitle: milestone?.title ?? "Unlinked photos",
        _subTitle: sub?.title ?? null,
        _reportDate: reportDate,
      };
    });
  }, [media, progressById, subById, milestoneById]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const days = dateRange === "all" ? null : parseInt(dateRange, 10);
    const q = search.trim().toLowerCase();
    return enriched.filter((f) => {
      if (milestoneId !== "all" && f._milestoneId !== milestoneId) return false;
      if (days !== null) {
        const d = new Date(f._reportDate).getTime();
        if (isNaN(d) || now - d > days * 86400000) return false;
      }
      if (q) {
        const hay = `${f.caption ?? ""} ${f._milestoneTitle} ${f._subTitle ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [enriched, milestoneId, dateRange, search]);

  // group by milestone -> date
  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; dates: Map<string, Media[]> }>();
    for (const f of filtered) {
      let g = map.get(f._milestoneId);
      if (!g) {
        g = { title: f._milestoneTitle, dates: new Map() };
        map.set(f._milestoneId, g);
      }
      const arr = g.dates.get(f._reportDate) ?? [];
      arr.push(f);
      g.dates.set(f._reportDate, arr);
    }
    return Array.from(map.entries()).map(([id, g]) => ({
      id,
      title: g.title,
      dateGroups: Array.from(g.dates.entries())
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([date, files]) => ({ date, files })),
      total: Array.from(g.dates.values()).reduce((a, b) => a + b.length, 0),
    }));
  }, [filtered]);

  const milestonesWithPhotos = useMemo(() => {
    const ids = new Set(enriched.map((f) => f._milestoneId));
    return Array.from(ids).map((id) => ({
      id,
      title: id === "__unlinked__" ? "Unlinked photos" : milestoneById.get(id)?.title ?? "—",
    }));
  }, [enriched, milestoneById]);

  const downloadOne = async (f: Media) => {
    try {
      const res = await fetch(getMediaUrl(f.storage_path));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (f.caption || f.storage_path.split("/").pop() || "photo").replace(/[/\\]/g, "_");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(getMediaUrl(f.storage_path), "_blank");
    }
  };

  const downloadGroup = async (files: Media[]) => {
    for (const f of files) {
      await downloadOne(f);
      await new Promise((r) => setTimeout(r, 150));
    }
  };

  const clearFilters = () => {
    setMilestoneId("all");
    setDateRange("all");
    setSearch("");
  };

  const hasFilters = milestoneId !== "all" || dateRange !== "all" || search.trim() !== "";

  if (enriched.length === 0) {
    return (
      <div className="metric-card text-center py-12">
        <Camera className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="font-display font-bold">No Photos Published</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Site photos will appear once approved by the project manager.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="metric-card p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search captions, milestones…"
            className="pl-8 h-9"
          />
        </div>
        <Select value={milestoneId} onValueChange={setMilestoneId}>
          <SelectTrigger className="h-9 w-[200px]">
            <SelectValue placeholder="Milestone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All milestones</SelectItem>
            {milestonesWithPhotos.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTERS.map((d) => (
              <SelectItem key={d.v} value={d.v}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
            <X className="h-3.5 w-3.5 mr-1" />Clear
          </Button>
        )}
        <div className="ml-auto text-xs text-muted-foreground tabular-nums">
          {filtered.length} of {enriched.length} photos
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="metric-card text-center py-10 text-sm text-muted-foreground">
          No photos match these filters.
        </div>
      ) : (
        grouped.map((g) => (
          <section key={g.id} className="metric-card p-4">
            <header className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <div>
                <h3 className="font-display font-bold text-base">{g.title}</h3>
                <p className="text-xs text-muted-foreground">{g.total} photo{g.total > 1 ? "s" : ""}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadGroup(g.dateGroups.flatMap((d) => d.files))}
              >
                <Download className="h-3.5 w-3.5 mr-1" />Download all
              </Button>
            </header>

            <div className="space-y-4">
              {g.dateGroups.map(({ date, files }) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {date}
                    </p>
                    <button
                      onClick={() => downloadGroup(files)}
                      className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Download className="h-3 w-3" />Download {files.length}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {files.map((f) => (
                      <PhotoTile
                        key={f.id}
                        file={f}
                        onOpen={() => setLightbox(f)}
                        onDownload={() => downloadOne(f)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      {lightbox && (
        <Lightbox file={lightbox} onClose={() => setLightbox(null)} onDownload={() => downloadOne(lightbox)} />
      )}
    </div>
  );
}

function PhotoTile({
  file,
  onOpen,
  onDownload,
}: {
  file: any;
  onOpen: () => void;
  onDownload: () => void;
}) {
  const isImage = file.mime_type?.startsWith("image/");
  return (
    <div className="group relative rounded-lg overflow-hidden border bg-muted/30">
      {isImage ? (
        <button onClick={onOpen} className="block w-full aspect-square">
          <img
            src={getMediaUrl(file.storage_path)}
            alt={file.caption ?? ""}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </button>
      ) : (
        <a
          href={getMediaUrl(file.storage_path)}
          target="_blank"
          rel="noreferrer"
          className="aspect-square flex items-center justify-center bg-muted"
        >
          <FileText className="h-8 w-8 text-muted-foreground" />
        </a>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDownload(); }}
        className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-background"
        aria-label="Download"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      {file.caption && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white opacity-0 group-hover:opacity-100 transition">
          <p className="truncate">{file.caption}</p>
        </div>
      )}
    </div>
  );
}

function Lightbox({
  file,
  onClose,
  onDownload,
}: {
  file: any;
  onClose: () => void;
  onDownload: () => void;
}) {
  const isImage = file.mime_type?.startsWith("image/");
  return (
    <div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 border-b" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0">
          <p className="font-display font-bold truncate">{file.caption ?? "Photo"}</p>
          <p className="text-xs text-muted-foreground">{file._milestoneTitle} · {file._reportDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download className="h-3.5 w-3.5 mr-1" />Download
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto" onClick={onClose}>
        {isImage ? (
          <img
            src={getMediaUrl(file.storage_path)}
            alt={file.caption ?? ""}
            className="max-h-full max-w-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <a href={getMediaUrl(file.storage_path)} target="_blank" rel="noreferrer" className="underline">
            Open file
          </a>
        )}
      </div>
    </div>
  );
}
