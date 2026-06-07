import jsPDF from "jspdf";

interface Project { title?: string; location?: string }
interface Report {
  report_type: "daily" | "weekly";
  report_date: string;
  week_start?: string | null;
  week_end?: string | null;
  title?: string | null;
  summary?: string | null;
  achievements?: string | null;
  challenges?: string | null;
  next_plan?: string | null;
  weather?: string | null;
  workforce_count?: number | null;
  notes?: string | null;
  status?: string;
}

export function generateJournalPdf(
  project: Project,
  reports: Report[],
  opts?: { type?: "daily" | "weekly" | "all"; includeInternal?: boolean },
) {
  const type = opts?.type ?? "all";
  const includeInternal = opts?.includeInternal ?? true;
  const filtered = reports.filter((r) => type === "all" || r.report_type === type);

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  let y = margin;

  const ensureSpace = (h: number) => { if (y + h > pageH - margin) { doc.addPage(); y = margin; } };
  const writeText = (text: string, size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, maxW);
    for (const line of lines) {
      ensureSpace(size + 4);
      doc.text(line, margin, y);
      y += size + 4;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Project Journal", margin, y); y += 28;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(project.title ?? "Project", margin, y); y += 18;
  if (project.location) { doc.setFontSize(11); doc.text(project.location, margin, y); y += 16; }
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `${type === "all" ? "Daily & Weekly" : type === "daily" ? "Daily" : "Weekly"} reports · ${filtered.length} entries · generated ${new Date().toLocaleDateString()}`,
    margin, y,
  );
  doc.setTextColor(0);
  y += 28;
  doc.setDrawColor(220);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  if (filtered.length === 0) writeText("No reports yet.", 12);

  const sorted = [...filtered].sort((a, b) => (a.report_date < b.report_date ? -1 : 1));
  for (const r of sorted) {
    ensureSpace(60);
    const dateLabel =
      r.report_type === "weekly" && r.week_start && r.week_end
        ? `Week of ${r.week_start} → ${r.week_end}`
        : r.report_date;
    writeText(`${r.report_type === "weekly" ? "WEEKLY" : "DAILY"} · ${dateLabel}`, 9, true);
    if (r.title) writeText(r.title, 14, true);

    const meta: string[] = [];
    if (r.weather) meta.push(`Weather: ${r.weather}`);
    if (typeof r.workforce_count === "number" && r.workforce_count > 0) meta.push(`Workforce: ${r.workforce_count}`);
    if (r.status) meta.push(`Status: ${r.status}`);
    if (meta.length) {
      doc.setTextColor(120); writeText(meta.join("  ·  "), 9); doc.setTextColor(0);
    }
    y += 4;

    const section = (label: string, body?: string | null) => {
      if (!body) return;
      writeText(label, 10, true);
      writeText(body, 11);
      y += 4;
    };
    section("Summary", r.summary);
    section("Achievements", r.achievements);
    section("Challenges / blockers", r.challenges);
    section(r.report_type === "weekly" ? "Plan for next week" : "Next-day activities", r.next_plan);
    if (includeInternal) section("Internal notes", r.notes);

    y += 10; ensureSpace(2);
    doc.setDrawColor(235);
    doc.line(margin, y, pageW - margin, y);
    y += 18;
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text(`${project.title ?? "Project"} — page ${i}/${pageCount}`, pageW / 2, pageH - 20, { align: "center" });
  }

  const fname = `${(project.title ?? "project").replace(/[^a-z0-9]+/gi, "_")}_journal_${type}.pdf`;
  doc.save(fname);
}
