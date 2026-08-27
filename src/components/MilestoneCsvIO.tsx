import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type Milestone = any;
type Sub = any;

function escape(v: any) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[\",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Excel often saves CSV as Windows-1252/ANSI (or UTF-16). Decode accordingly so
 *  French accents (é, è, à, ç, ô…) survive the import. */
async function decodeFile(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  // BOM checks
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(buf.subarray(3));
  }
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf.subarray(2));
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf.subarray(2));
  // Strict UTF-8 first; if it throws, the file is legacy 8-bit (Excel ANSI export)
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0] ?? "";
  const semis = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  const tabs = (firstLine.match(/\t/g) || []).length;
  if (tabs > semis && tabs > commas) return "\t";
  return semis > commas ? ";" : ",";
}

function parseCsv(text: string, delim = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let val = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { val += '"'; i++; }
        else inQ = false;
      } else val += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === delim) { cur.push(val); val = ""; }

      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(val); val = "";
        if (cur.length > 1 || cur[0] !== "") rows.push(cur);
        cur = [];
      } else val += c;
    }
  }
  if (val !== "" || cur.length) { cur.push(val); rows.push(cur); }
  return rows;
}

const EXPORT_HEADERS = [
  "milestone_title", "milestone_contribution_pct", "milestone_planned_date",
  "sub_title", "sub_unit", "sub_target_quantity", "sub_contribution_pct",
  "sub_completed_quantity", "sub_progress_pct",
];

const IMPORT_REQUIRED = [
  "milestone_title", "milestone_contribution_pct",
  "sub_title", "sub_unit", "sub_target_quantity", "sub_contribution_pct",
];

export function MilestoneCsvIO({
  projectId, projectCode, milestones, getSubs,
}: {
  projectId: string;
  projectCode: string;
  milestones: Milestone[];
  getSubs: (milestoneId: string) => Sub[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const handleExport = () => {
    const lines = [EXPORT_HEADERS.join(",")];
    for (const m of milestones) {
      const subs = getSubs(m.id);
      if (subs.length === 0) {
        lines.push([m.title, m.contribution_pct ?? 0, m.planned_date ?? "", "", "", "", "", "", ""].map(escape).join(","));
      } else {
        for (const s of subs) {
          lines.push([
            m.title, m.contribution_pct ?? 0, m.planned_date ?? "",
            s.title, s.unit, s.target_quantity, s.contribution_pct,
            s.completed_quantity ?? 0, s.progress_pct ?? 0,
          ].map(escape).join(","));
        }
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${projectCode}-milestones.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const lines = [
      IMPORT_REQUIRED.concat(["milestone_planned_date"]).join(","),
      ["Foundation", 20, "Excavation", "m3", 500, 60, ""].map(escape).join(","),
      ["Foundation", 20, "Rebar install", "kg", 1200, 40, ""].map(escape).join(","),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "milestones-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    if (!user) { toast.error("Not authenticated"); return; }
    setBusy(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) throw new Error("CSV is empty");
      const header = rows[0].map((h) => h.trim());
      const idx: Record<string, number> = {};
      header.forEach((h, i) => (idx[h] = i));
      for (const k of IMPORT_REQUIRED) {
        if (!(k in idx)) throw new Error(`Missing column: ${k}`);
      }

      const byTitle = new Map<string, Milestone>();
      for (const m of milestones) byTitle.set(m.title, m);
      let nextOrder = milestones.length;

      const groups = new Map<string, { contribution: number; planned: string | null; subs: any[] }>();
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.every((c) => c.trim() === "")) continue;
        const mt = (r[idx.milestone_title] ?? "").trim();
        if (!mt) continue;
        const mContrib = Number(r[idx.milestone_contribution_pct] ?? 0);
        const planned = idx.milestone_planned_date !== undefined ? (r[idx.milestone_planned_date]?.trim() || null) : null;
        const g = groups.get(mt) ?? { contribution: mContrib, planned, subs: [] };
        const st = (r[idx.sub_title] ?? "").trim();
        if (st) {
          g.subs.push({
            title: st,
            unit: (r[idx.sub_unit] ?? "unit").trim() || "unit",
            target_quantity: Number(r[idx.sub_target_quantity] ?? 0),
            contribution_pct: Number(r[idx.sub_contribution_pct] ?? 0),
          });
        }
        groups.set(mt, g);
      }

      let createdM = 0, createdS = 0, skipped = 0;
      for (const [title, g] of groups) {
        let milestone = byTitle.get(title);
        if (!milestone) {
          const { data, error } = await supabase.from("milestones").insert({
            project_id: projectId, title, planned_date: g.planned,
            ordering: nextOrder++, contribution_pct: g.contribution,
          }).select().single();
          if (error) throw error;
          milestone = data;
          byTitle.set(title, milestone);
          createdM++;
        }
        const existingSubs = getSubs(milestone.id);
        const existingTitles = new Set(existingSubs.map((s) => s.title));
        let subOrder = existingSubs.length;
        for (const s of g.subs) {
          if (existingTitles.has(s.title)) { skipped++; continue; }
          const { error } = await (supabase.from("sub_milestones" as any).insert({
            project_id: projectId,
            milestone_id: milestone.id,
            title: s.title,
            unit: s.unit,
            target_quantity: s.target_quantity,
            contribution_pct: s.contribution_pct,
            ordering: subOrder++,
            created_by: user.id,
          }) as any);
          if (error) throw error;
          createdS++;
        }
      }

      await qc.invalidateQueries({ queryKey: ["milestones"] });
      await qc.invalidateQueries({ queryKey: ["sub_milestones"] });
      await qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Imported: ${createdM} milestone(s), ${createdS} sub-milestone(s)${skipped ? `, ${skipped} skipped` : ""}`);
    } catch (e: any) {
      toast.error(e.message ?? "Import failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
      />
      <Button size="sm" variant="outline" onClick={handleDownloadTemplate} disabled={busy}>
        Template
      </Button>
      <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
        <Upload className="h-4 w-4 mr-1" />{busy ? "Importing…" : "Import CSV"}
      </Button>
      <Button size="sm" variant="outline" onClick={handleExport} disabled={milestones.length === 0}>
        <Download className="h-4 w-4 mr-1" />Export CSV
      </Button>
    </div>
  );
}
