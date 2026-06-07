import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, useCreateReport, useUpdateReport, ReportType } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";

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
  });

  useEffect(() => {
    if (existing) {
      setForm({
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
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id, open]);

  const submit = async (status: "draft" | "submitted") => {
    if (!form.project_id) { toast.error("Select a project"); return; }
    if (!form.summary.trim()) { toast.error("Summary is required"); return; }
    try {
      const payload = {
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
        workforce_count: Number(form.workforce_count) || 0,
        notes: form.notes || null,
        status,
      };
      if (existing) {
        await update.mutateAsync({ id: existing.id, ...payload });
      } else {
        await create.mutateAsync(payload);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Edit" : "New"} {type === "weekly" ? "weekly report" : "daily report"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!defaultProjectId && !existing && (
            <div>
              <Label>Project</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "weekly" ? (
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
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} />
              </div>
              <div>
                <Label>Weather</Label>
                <Input placeholder="Sunny, 30°C" value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })} />
              </div>
            </div>
          )}

          <div>
            <Label>Title</Label>
            <Input placeholder={type === "weekly" ? "Week 12 — Foundations & framing" : "Day summary headline"}
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          {type === "daily" && (
            <div>
              <Label>Workforce on site</Label>
              <Input type="number" min={0} value={form.workforce_count}
                onChange={(e) => setForm({ ...form, workforce_count: Number(e.target.value) })} />
            </div>
          )}

          <div>
            <Label>Summary {type === "weekly" && <span className="text-xs text-muted-foreground">(client-facing)</span>}</Label>
            <Textarea rows={3} placeholder="Overview of the day's / week's work."
              value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>

          <div>
            <Label>Achievements</Label>
            <Textarea rows={3} placeholder="What was completed / progressed."
              value={form.achievements} onChange={(e) => setForm({ ...form, achievements: e.target.value })} />
          </div>

          <div>
            <Label>Challenges / blockers</Label>
            <Textarea rows={2} placeholder="Issues, delays, decisions needed."
              value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} />
          </div>

          <div>
            <Label>{type === "weekly" ? "Plan for next week" : "Next-day activities"}</Label>
            <Textarea rows={2} value={form.next_plan}
              onChange={(e) => setForm({ ...form, next_plan: e.target.value })} />
          </div>

          {type === "daily" && (
            <div>
              <Label>Internal notes</Label>
              <Textarea rows={2} placeholder="Not shown to client"
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => submit("draft")} disabled={create.isPending || update.isPending}>
            Save draft
          </Button>
          <Button onClick={() => submit("submitted")} disabled={create.isPending || update.isPending}>
            {type === "weekly" ? "Submit for review" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
