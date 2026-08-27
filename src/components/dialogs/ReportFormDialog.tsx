import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, useCreateReport, useUpdateReport, ReportType } from "@/hooks/useBuildTrust";
import { useObligations } from "@/hooks/usePlanning";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Props {
  type: ReportType;
  defaultProjectId?: string;
  existing?: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}

function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  x.setDate(x.getDate() + diff);
  return x.toISOString().slice(0, 10);
}
function endOfWeek(d = new Date()) {
  const start = new Date(startOfWeek(d));
  start.setDate(start.getDate() + 6);
  return start.toISOString().slice(0, 10);
}

type Row = Record<string, string>;

function RowTable({
  title, columns, rows, onChange, addLabel,
}: {
  title: string;
  columns: { key: string; label: string; type?: string; width?: string }[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  addLabel: string;
}) {
  const blank = () => Object.fromEntries(columns.map((c) => [c.key, ""])) as Row;
  return (
    <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...rows, blank()])}>
          <Plus className="h-3 w-3 mr-1" />{addLabel}
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entry recorded.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-end gap-2">
              <div className="grid gap-2 flex-1" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0,1fr))` }}>
                {columns.map((c) => (
                  <div key={c.key}>
                    <Label className="text-[11px] text-muted-foreground">{c.label}</Label>
                    <Input
                      className="h-8"
                      type={c.type ?? "text"}
                      value={row[c.key] ?? ""}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...next[i], [c.key]: e.target.value };
                        onChange(next);
                      }}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" size="icon" variant="ghost" className="text-destructive"
                onClick={() => onChange(rows.filter((_, k) => k !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportFormDialog({ type, defaultProjectId, existing, trigger, open: openProp, onOpenChange }: Props) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;

  const { data: projects = [] } = useProjects();
  const create = useCreateReport();
  const update = useUpdateReport();

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    project_id: defaultProjectId ?? "",
    report_date: today,
    week_start: startOfWeek(),
    week_end: endOfWeek(),
    title: "",
    summary: "",
    achievements: "",
    challenges: "",
    next_plan: "",
    weather: "",
    workforce_count: 0,
    notes: "",
    work_start_time: "",
    work_end_time: "",
    work_area: "",
    owner_instructions: "",
    supervision_instructions: "",
    safety_observations: "",
    technical_observations: "",
    corrective_actions: "",
    delays: "",
  });
  const [personnel, setPersonnel] = useState<Row[]>([]);
  const [equipment, setEquipment] = useState<Row[]>([]);
  const [works, setWorks] = useState<Row[]>([]);
  const [materials, setMaterials] = useState<Row[]>([]);

  const { data: obligations = [] } = useObligations(form.project_id || undefined);
  const matchingObligation = useMemo(() => {
    const kind = type === "weekly" ? "weekly" : "daily";
    const date = type === "weekly" ? form.week_end : form.report_date;
    return (obligations as any[]).find(
      (o) => o.kind === kind && o.due_date === date && o.status !== "absent",
    );
  }, [obligations, type, form.report_date, form.week_end]);

  useEffect(() => {
    if (existing) {
      setForm((f) => ({
        ...f,
        project_id: existing.project_id ?? "",
        report_date: existing.report_date ?? today,
        week_start: existing.week_start ?? startOfWeek(),
        week_end: existing.week_end ?? endOfWeek(),
        title: existing.title ?? "",
        summary: existing.summary ?? "",
        achievements: existing.achievements ?? "",
        challenges: existing.challenges ?? "",
        next_plan: existing.next_plan ?? "",
        weather: existing.weather ?? "",
        workforce_count: existing.workforce_count ?? 0,
        notes: existing.notes ?? "",
        work_start_time: existing.work_start_time ?? "",
        work_end_time: existing.work_end_time ?? "",
        work_area: existing.work_area ?? "",
        owner_instructions: existing.owner_instructions ?? "",
        supervision_instructions: existing.supervision_instructions ?? "",
        safety_observations: existing.safety_observations ?? "",
        technical_observations: existing.technical_observations ?? "",
        corrective_actions: existing.corrective_actions ?? "",
        delays: existing.delays ?? "",
      }));
      setPersonnel(Array.isArray(existing.personnel) ? existing.personnel : []);
      setEquipment(Array.isArray(existing.equipment) ? existing.equipment : []);
      setWorks(Array.isArray(existing.works_done) ? existing.works_done : []);
      setMaterials(Array.isArray(existing.materials) ? existing.materials : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id, open]);

  const submit = async (status: "draft" | "submitted") => {
    if (!form.project_id) { toast.error("Select a project"); return; }
    if (!form.summary.trim()) { toast.error("A summary is required"); return; }
    if (status === "submitted" && works.length === 0) {
      toast.error("Record at least one line under works carried out");
      return;
    }
    try {
      const payload: any = {
        project_id: form.project_id,
        report_type: type,
        report_date: type === "weekly" ? form.week_end : form.report_date,
        week_start: type === "weekly" ? form.week_start : null,
        week_end: type === "weekly" ? form.week_end : null,
        title: form.title || null,
        summary: form.summary,
        achievements: form.achievements || null,
        challenges: form.challenges || null,
        next_plan: form.next_plan || null,
        weather: form.weather || null,
        workforce_count:
          Number(form.workforce_count) ||
          personnel.reduce((s, p) => s + (Number(p.nombre) || 0), 0),
        notes: form.notes || null,
        work_start_time: form.work_start_time || null,
        work_end_time: form.work_end_time || null,
        work_area: form.work_area || null,
        owner_instructions: form.owner_instructions || null,
        supervision_instructions: form.supervision_instructions || null,
        safety_observations: form.safety_observations || null,
        technical_observations: form.technical_observations || null,
        corrective_actions: form.corrective_actions || null,
        delays: form.delays || null,
        personnel: personnel.map((p) => ({ poste: p.poste ?? "", nombre: Number(p.nombre) || 0 })),
        equipment: equipment.map((e) => ({ designation: e.designation ?? "", utilisation: e.utilisation ?? "" })),
        works_done: works.map((w) => ({ designation: w.designation ?? "", observations: w.observations ?? "" })),
        materials: materials.map((m) => ({
          designation: m.designation ?? "",
          stock_matin: m.stock_matin ?? "",
          approvisionnement: m.approvisionnement ?? "",
          consomme: m.consomme ?? "",
          stock_soir: m.stock_soir ?? "",
        })),
        status,
      };
      if (existing) {
        await update.mutateAsync({ id: existing.id, ...payload });
      } else {
        await create.mutateAsync({
          ...payload,
          obligation_id: matchingObligation?.id ?? null,
          weekly_work_plan_id: matchingObligation?.weekly_work_plan_id ?? null,
        });
      }
      toast.success(status === "submitted" ? `${type === "weekly" ? "Weekly" : "Daily"} report submitted` : "Draft saved");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  const triggerEl =
    trigger ??
    (existing ? (
      <Button size="sm" variant="outline"><Pencil className="h-3 w-3 mr-1" />Edit</Button>
    ) : (
      <Button>
        <Plus className="h-4 w-4 mr-1" />
        New {type === "weekly" ? "weekly" : "daily"} report
      </Button>
    ));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && <DialogTrigger asChild>{triggerEl}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Edit" : "New"} {type === "weekly" ? "weekly site journal (Journal de Chantier Hebdomadaire)" : "daily site journal (Journal de Chantier)"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!defaultProjectId && !existing && (
            <div>
              <Label>Project</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {(projects as any[]).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {!existing && (
            <p className="text-xs text-muted-foreground">
              {matchingObligation
                ? `This report answers a planned reporting obligation due ${new Date(matchingObligation.due_at).toLocaleString()}.`
                : "No planned obligation matches this date — the report is recorded as supplementary."}
            </p>
          )}

          {type === "weekly" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Week start</Label>
                <Input type="date" value={form.week_start} onChange={(e) => setForm({ ...form, week_start: e.target.value })} />
              </div>
              <div>
                <Label>Week end</Label>
                <Input type="date" value={form.week_end} onChange={(e) => setForm({ ...form, week_end: e.target.value })} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {type === "daily" && (
              <div>
                <Label>Date</Label>
                <Input type="date" max={today} value={form.report_date}
                  onChange={(e) => setForm({ ...form, report_date: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Weather</Label>
              <Input placeholder="Ensoleillé, 30°C" value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })} />
            </div>
            <div>
              <Label>Start of work</Label>
              <Input type="time" value={form.work_start_time} onChange={(e) => setForm({ ...form, work_start_time: e.target.value })} />
            </div>
            <div>
              <Label>End of work</Label>
              <Input type="time" value={form.work_end_time} onChange={(e) => setForm({ ...form, work_end_time: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input placeholder={type === "weekly" ? "Week 12 — Foundations & framing" : "Day headline"}
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Work area / section</Label>
              <Input placeholder="Zone A — foundations" value={form.work_area}
                onChange={(e) => setForm({ ...form, work_area: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Summary {type === "weekly" && <span className="text-xs text-muted-foreground">(client-facing)</span>}</Label>
            <Textarea rows={3} placeholder="Overview of the day's / week's work."
              value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>

          <>
              <RowTable
                title="Personnel présent"
                addLabel="Add post"
                columns={[{ key: "poste", label: "Poste" }, { key: "nombre", label: "Nombre", type: "number" }]}
                rows={personnel}
                onChange={setPersonnel}
              />
              <RowTable
                title="Matériel sur chantier"
                addLabel="Add equipment"
                columns={[
                  { key: "designation", label: "Désignation" },
                  { key: "utilisation", label: "Marche / Immobilisé / Panne" },
                ]}
                rows={equipment}
                onChange={setEquipment}
              />
              <RowTable
                title="Travaux réalisés"
                addLabel="Add work item"
                columns={[
                  { key: "designation", label: "Désignation des travaux" },
                  { key: "observations", label: "Observations" },
                ]}
                rows={works}
                onChange={setWorks}
              />
              <RowTable
                title="Consommation matériaux"
                addLabel="Add material"
                columns={[
                  { key: "designation", label: "Désignation" },
                  { key: "stock_matin", label: "Stock matin" },
                  { key: "approvisionnement", label: "Approvision." },
                  { key: "consomme", label: "Consommé" },
                  { key: "stock_soir", label: "Stock soir" },
                ]}
                rows={materials}
                onChange={setMaterials}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Instructions du maître d'ouvrage</Label>
                  <Textarea rows={2} value={form.owner_instructions}
                    onChange={(e) => setForm({ ...form, owner_instructions: e.target.value })} />
                </div>
                <div>
                  <Label>Instructions de la mission de contrôle</Label>
                  <Textarea rows={2} value={form.supervision_instructions}
                    onChange={(e) => setForm({ ...form, supervision_instructions: e.target.value })} />
                </div>
                <div>
                  <Label>Observations HSE / sécurité</Label>
                  <Textarea rows={2} value={form.safety_observations}
                    onChange={(e) => setForm({ ...form, safety_observations: e.target.value })} />
                </div>
                <div>
                  <Label>Observations techniques</Label>
                  <Textarea rows={2} value={form.technical_observations}
                    onChange={(e) => setForm({ ...form, technical_observations: e.target.value })} />
                </div>
              </div>
            </>

          <div>
            <Label>Achievements</Label>
            <Textarea rows={2} placeholder="What was completed / progressed."
              value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Challenges / blockers</Label>
              <Textarea rows={2} value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
            </div>
            <div>
              <Label>Delays encountered</Label>
              <Textarea rows={2} value={form.delays} onChange={(e) => setForm({ ...form, delays: e.target.value })} />
            </div>
            <div>
              <Label>Corrective actions</Label>
              <Textarea rows={2} value={form.corrective_actions}
                onChange={(e) => setForm({ ...form, corrective_actions: e.target.value })} />
            </div>
            <div>
              <Label>{type === "weekly" ? "Plan for next week" : "Next-day activities"}</Label>
              <Textarea rows={2} value={form.next_plan} onChange={(e) => setForm({ ...form, next_plan: e.target.value })} />
            </div>
          </div>

          {type === "daily" && (
            <div>
              <Label>Internal notes</Label>
              <Textarea rows={2} placeholder="Never shown to the client"
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          {existing ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={create.isPending || update.isPending}>
                Cancel
              </Button>
              <Button onClick={() => submit(existing.status === "draft" ? "draft" : "submitted")} disabled={create.isPending || update.isPending}>
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => submit("draft")} disabled={create.isPending || update.isPending}>
                Save draft
              </Button>
              <Button onClick={() => submit("submitted")} disabled={create.isPending || update.isPending}>
                {type === "weekly" ? "Submit for review" : "Submit"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
