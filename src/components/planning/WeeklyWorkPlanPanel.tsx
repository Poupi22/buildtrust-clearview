import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CalendarRange, Lock, Play, Plus, Trash2, CheckCircle2 } from "lucide-react";
import {
  useWeeklyPlans, useCreateWeeklyPlan, useSetWeeklyPlanStatus, useWorkDays,
  usePlannedActivities, useActivePlanVersion, useObligations,
} from "@/hooks/usePlanning";
import { useProjectMembers, useMilestones, useSubMilestones, useAllProfiles } from "@/hooks/useBuildTrust";

const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-warning/15 text-warning",
  active: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
  void: "bg-destructive/15 text-destructive",
};
const cycleTone: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  compliant: "bg-success/15 text-success",
  non_compliant: "bg-destructive/15 text-destructive",
  void: "bg-destructive/15 text-destructive",
};

function mondayOf(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() + ((day === 0 ? -6 : 1) - day));
  return x.toISOString().slice(0, 10);
}
function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function WeeklyWorkPlanPanel({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const { data: plans = [] } = useWeeklyPlans(projectId);
  const { data: activePlan } = useActivePlanVersion(projectId);
  const { data: members = [] } = useProjectMembers(projectId);
  const { data: profiles = [] } = useAllProfiles();
  const { data: milestones = [] } = useMilestones(projectId);
  const { data: subMilestones = [] } = useSubMilestones(projectId);
  const create = useCreateWeeklyPlan();
  const setStatus = useSetWeeklyPlanStatus();

  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(mondayOf());
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [outcome, setOutcome] = useState("");
  const [rows, setRows] = useState<Array<{ work_date: string; title: string; milestone_id: string; sub_milestone_id: string; responsible_id: string; planned_quantity: string; unit: string }>>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(start, i)), [start]);
  const end = week[6];

  const nameOf = (uid: string) =>
    (profiles as any[]).find((p) => p.user_id === uid)?.full_name || "Team member";

  const onCreate = async () => {
    if (!selected.length) { toast.error("Select at least one working day"); return; }
    try {
      await create.mutateAsync({
        project_id: projectId,
        plan_version_id: activePlan?.id ?? null,
        start_date: start,
        end_date: end,
        workingDays: selected,
        notes,
        expected_outcome: outcome,
        activities: rows.map((r) => ({
          work_date: r.work_date,
          title: r.title,
          milestone_id: r.milestone_id || null,
          sub_milestone_id: r.sub_milestone_id || null,
          responsible_id: r.responsible_id || null,
          planned_quantity: r.planned_quantity ? Number(r.planned_quantity) : null,
          unit: r.unit || null,
        })),
      });
      toast.success("Weekly work plan created as draft");
      setOpen(false); setSelected([]); setRows([]); setNotes(""); setOutcome("");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const activateWeek = async (id: string) => {
    try {
      await setStatus.mutateAsync({ id, status: "active" });
      toast.success("Week activated — working days locked and reporting obligations created");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-lg">Weekly work plans</h2>
          <p className="text-sm text-muted-foreground">
            Commitments for the week. Activating locks the working days and creates the daily and weekly reporting obligations.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={!activePlan} title={activePlan ? "" : "An active baseline plan is required"}>
                <Plus className="h-4 w-4 mr-1" />New weekly plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>New weekly work plan</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Week starting (Monday)</Label>
                  <Input type="date" value={start} onChange={(e) => { setStart(e.target.value); setSelected([]); setRows([]); }} />
                  <p className="text-xs text-muted-foreground mt-1">{start} → {end}</p>
                </div>

                <div>
                  <Label>Working days</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {week.map((d) => (
                      <label key={d} className="flex items-center gap-2 rounded-lg border p-2 text-sm cursor-pointer">
                        <Checkbox checked={selected.includes(d)}
                          onCheckedChange={(c) => setSelected(c ? [...selected, d] : selected.filter((x) => x !== d))} />
                        <span>{new Date(d).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" })}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Planned activities</Label>
                    <Button size="sm" variant="outline" disabled={!selected.length}
                      onClick={() => setRows([...rows, { work_date: selected[0], title: "", milestone_id: "", sub_milestone_id: "", responsible_id: "", planned_quantity: "", unit: "" }])}>
                      <Plus className="h-3 w-3 mr-1" />Add activity
                    </Button>
                  </div>
                  {rows.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Select value={r.work_date} onValueChange={(v) => setRows(rows.map((x, j) => j === i ? { ...x, work_date: v } : x))}>
                          <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                          <SelectContent>
                            {selected.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input className="sm:col-span-2" placeholder="Activity" value={r.title}
                          onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Select value={r.milestone_id} onValueChange={(v) => setRows(rows.map((x, j) => j === i ? { ...x, milestone_id: v } : x))}>
                          <SelectTrigger><SelectValue placeholder="Project step" /></SelectTrigger>
                          <SelectContent>
                            {(milestones as any[]).map((m) => <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={r.sub_milestone_id} onValueChange={(v) => setRows(rows.map((x, j) => j === i ? { ...x, sub_milestone_id: v } : x))}>
                          <SelectTrigger><SelectValue placeholder="Sub-step" /></SelectTrigger>
                          <SelectContent>
                            {(subMilestones as any[])
                              .filter((s) => !r.milestone_id || s.milestone_id === r.milestone_id)
                              .map((s) => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={r.responsible_id} onValueChange={(v) => setRows(rows.map((x, j) => j === i ? { ...x, responsible_id: v } : x))}>
                          <SelectTrigger><SelectValue placeholder="Responsible" /></SelectTrigger>
                          <SelectContent>
                            {(members as any[]).map((m) => <SelectItem key={m.user_id} value={m.user_id}>{nameOf(m.user_id)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <Input type="number" placeholder="Planned quantity" value={r.planned_quantity}
                          onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, planned_quantity: e.target.value } : x))} />
                        <Input placeholder="Unit" value={r.unit}
                          onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, unit: e.target.value } : x))} />
                        <Button size="icon" variant="ghost" onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <Label>Expected outcome</Label>
                  <Textarea rows={2} value={outcome} onChange={(e) => setOutcome(e.target.value)} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={onCreate} disabled={create.isPending}>Create draft</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!activePlan && canManage && (
        <p className="text-xs text-warning">A weekly work plan can only be created once the baseline plan is active.</p>
      )}

      <div className="space-y-3">
        {plans.length === 0 && <div className="metric-card text-center py-10 text-sm text-muted-foreground">No weekly work plan yet.</div>}
        {plans.map((p: any) => (
          <div key={p.id} className="metric-card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <button className="text-left" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <CalendarRange className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Week {p.week_no} · {p.year}</span>
                  <Badge variant="secondary" className={statusTone[p.status]}>{p.status}</Badge>
                  <Badge variant="secondary" className={cycleTone[p.cycle_status]}>{p.cycle_status.replace("_", "-")}</Badge>
                  {p.status === "active" && <Lock className="h-3.5 w-3.5 text-success" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{p.start_date} → {p.end_date}</p>
              </button>
              {canManage && (
                <div className="flex gap-2">
                  {p.status === "draft" && (
                    <Button size="sm" onClick={() => activateWeek(p.id)} disabled={setStatus.isPending}>
                      <Play className="h-4 w-4 mr-1" />Activate week
                    </Button>
                  )}
                  {p.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutateAsync({ id: p.id, status: "closed" })}>
                      <CheckCircle2 className="h-4 w-4 mr-1" />Close week
                    </Button>
                  )}
                </div>
              )}
            </div>
            {expanded === p.id && <WeekDetail planId={p.id} projectId={projectId} nameOf={nameOf} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeekDetail({ planId, projectId, nameOf }: { planId: string; projectId: string; nameOf: (id: string) => string }) {
  const { data: days = [] } = useWorkDays(planId);
  const { data: activities = [] } = usePlannedActivities(planId);
  const { data: obligations = [] } = useObligations(projectId);
  const weekObligations = (obligations as any[]).filter((o) => o.weekly_work_plan_id === planId);

  return (
    <div className="mt-4 border-t pt-4 space-y-4">
      <div>
        <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground mb-2">Working calendar</p>
        <div className="flex flex-wrap gap-2">
          {(days as any[]).map((d) => (
            <span key={d.id}
              className={`text-xs rounded-md px-2 py-1 border ${d.is_working_day ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground"}`}>
              {new Date(d.work_date).toLocaleDateString(undefined, { weekday: "short", day: "2-digit" })}
              {d.is_working_day ? "" : " · non-working"}
              {d.reporting_status === "unworked_unreported" ? " · unreported" : ""}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground mb-2">Planned activities</p>
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground">None recorded.</p>
        ) : (
          <div className="space-y-1">
            {(activities as any[]).map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm gap-3">
                <span className="min-w-0 truncate">{a.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {a.responsible_id ? nameOf(a.responsible_id) : "Unassigned"}
                  {a.planned_quantity ? ` · ${a.planned_quantity} ${a.unit ?? ""}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {weekObligations.length > 0 && (
        <div>
          <p className="text-xs uppercase font-semibold tracking-wider text-muted-foreground mb-2">Reporting obligations</p>
          <div className="flex flex-wrap gap-2">
            {weekObligations.map((o) => (
              <span key={o.id}
                className={`text-xs rounded-md px-2 py-1 ${
                  o.status === "absent" ? "bg-destructive/15 text-destructive"
                    : o.status === "pending" ? "bg-warning/15 text-warning"
                    : "bg-success/15 text-success"}`}>
                {o.kind} · {o.due_date} · {o.status}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
