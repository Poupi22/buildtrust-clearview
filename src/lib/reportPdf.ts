import jsPDF from "jspdf";

interface Project { title?: string; location?: string }

interface PersonnelRow { poste?: string; nombre?: number }
interface EquipmentRow { designation?: string; utilisation?: string }
interface WorkRow { designation?: string; observations?: string }
interface MaterialRow {
  designation?: string;
  stock_matin?: number | string;
  approvisionnement?: number | string;
  consomme?: number | string;
  stock_soir?: number | string;
}
interface SignatureSnapshot {
  name?: string;
  role?: string;
  initials?: string;
  signed_at?: string;
}

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
  work_hours?: string | null;
  personnel?: PersonnelRow[] | null;
  equipment?: EquipmentRow[] | null;
  works_done?: WorkRow[] | null;
  materials?: MaterialRow[] | null;
  owner_instructions?: string | null;
  supervision_instructions?: string | null;
  signature_snapshot?: SignatureSnapshot | null;
  approver_signature_snapshot?: SignatureSnapshot | null;
}

const asRows = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

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

  const table = (headers: string[], rows: string[][]) => {
    if (!rows.length) return;
    const colW = maxW / headers.length;
    const drawRow = (cells: string[], bold: boolean) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(9);
      const cellLines = cells.map((c) => doc.splitTextToSize(c || "—", colW - 8));
      const rowH = Math.max(...cellLines.map((l) => l.length)) * 11 + 8;
      ensureSpace(rowH);
      cells.forEach((_, i) => {
        const x = margin + i * colW;
        doc.setDrawColor(200);
        doc.rect(x, y, colW, rowH);
        cellLines[i].forEach((line: string, li: number) => doc.text(line, x + 4, y + 13 + li * 11));
      });
      y += rowH;
    };
    drawRow(headers, true);
    rows.forEach((r) => drawRow(r, false));
    y += 8;
  };

  /* ---------- Cover header ---------- */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Journal de Chantier — Project Journal", margin, y); y += 28;
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
    writeText(`${r.report_type === "weekly" ? "JOURNAL DE CHANTIER HEBDOMADAIRE" : "JOURNAL DE CHANTIER"} · ${dateLabel}`, 9, true);
    if (r.title) writeText(r.title, 14, true);

    const meta: string[] = [];
    if (r.weather) meta.push(`Météo: ${r.weather}`);
    if (r.work_hours) meta.push(`Heures: ${r.work_hours}`);
    if (typeof r.workforce_count === "number" && r.workforce_count > 0) meta.push(`Effectif: ${r.workforce_count}`);
    if (r.status) meta.push(`Statut: ${r.status}`);
    if (meta.length) {
      doc.setTextColor(120); writeText(meta.join("  ·  "), 9); doc.setTextColor(0);
    }
    y += 6;

    {
      const personnel = asRows<PersonnelRow>(r.personnel);
      if (personnel.length) {
        writeText("Personnel", 10, true);
        table(["Poste", "Nombre"], personnel.map((p) => [p.poste ?? "", String(p.nombre ?? "")]));
      }
      const equipment = asRows<EquipmentRow>(r.equipment);
      if (equipment.length) {
        writeText("Matériel", 10, true);
        table(["Désignation", "Utilisation (Marche / Immobilisé / Panne)"], equipment.map((e) => [e.designation ?? "", e.utilisation ?? ""]));
      }
      const works = asRows<WorkRow>(r.works_done);
      if (works.length) {
        writeText("Travaux réalisés", 10, true);
        table(["Désignation", "Observations"], works.map((w) => [w.designation ?? "", w.observations ?? ""]));
      }
      const materials = asRows<MaterialRow>(r.materials);
      if (materials.length) {
        writeText("Consommation matériaux", 10, true);
        table(
          ["Désignation", "Stock matin", "Approvisionnement", "Consommé", "Stock soir"],
          materials.map((m) => [
            m.designation ?? "",
            String(m.stock_matin ?? ""),
            String(m.approvisionnement ?? ""),
            String(m.consomme ?? ""),
            String(m.stock_soir ?? ""),
          ]),
        );
      }
      const section = (label: string, body?: string | null) => {
        if (!body) return;
        writeText(label, 10, true);
        writeText(body, 11);
        y += 4;
      };
      section("Instructions du maître de l'ouvrage", r.owner_instructions);
      section("Instructions de la mission de contrôle", r.supervision_instructions);
      if (r.summary) section("Résumé", r.summary);
      if (r.challenges) section("Difficultés / blocages", r.challenges);
    } else {
      const section = (label: string, body?: string | null) => {
        if (!body) return;
        writeText(label, 10, true);
        writeText(body, 11);
        y += 4;
      };
      section("Summary", r.summary);
      section("Achievements", r.achievements);
      section("Challenges / blockers", r.challenges);
      section("Plan for next week", r.next_plan);
    }
    if (includeInternal) {
      if (r.notes) { writeText("Internal notes", 10, true); writeText(r.notes, 11); y += 4; }
    }

    /* ---------- Visas / signatures ---------- */
    const sig = r.signature_snapshot;
    const appr = r.approver_signature_snapshot;
    if (sig || appr) {
      ensureSpace(50);
      writeText("Visas", 10, true);
      doc.setFontSize(9);
      doc.setTextColor(80);
      const sigLine = (label: string, s?: SignatureSnapshot | null) => {
        if (!s) return;
        ensureSpace(14);
        doc.text(
          `${label}: ${s.name ?? ""}${s.role ? ` (${s.role})` : ""}${s.initials ? ` — ${s.initials}` : ""}${s.signed_at ? ` · ${new Date(s.signed_at).toLocaleString()}` : ""}`,
          margin, y,
        );
        y += 13;
      };
      sigLine("Visa entreprise (auteur)", sig);
      sigLine("Visa mission de contrôle (approbation)", appr);
      doc.setTextColor(0);
      y += 6;
    }

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
