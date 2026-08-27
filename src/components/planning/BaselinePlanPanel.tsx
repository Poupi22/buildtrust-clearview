import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileUp, Lock, ShieldCheck, Plus, Trash2, History } from "lucide-react";
import {
  usePlanVersions,
  useSubmitPlanVersion,
  useActivatePlanVersion,
  usePlanActivities,
} from "@/hooks/usePlanning";
import { useIsSuperAdmin } from "@/hooks/useBuildTrust";

const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-warning/15 text-warning",
  active: "bg-success/15 text-success",
  archived: "bg-muted text-muted-foreground",
};

export function BaselinePlanPanel({ projectId, canManage }: { projectId: string; canManage: boolean }) {
  const { data: versions = [], isLoading } = usePlanVersions(projectId);
  const isSuperAdmin = useIsSuperAdmin();
  const submit = useSubmitPlanVersion();
  const activate = useActivatePlanVersion();

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    planned_start_date: "",
    planned_end_date: "",
    period_label: "",
    revision_reason: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [activities, setActivities] = useState([{ title: "", planned_start: "", planned_end: "", dependency: "" }]);

  const active = versions.find((v: any) => v.status === "active");

  const onSubmit = async () => {
    if (!form.title.trim()) { toast.error("Give the planning a title"); return; }
    try {
      await submit.mutateAsync({ project_id: projectId, ...form, file, activities });
      toast.success("Baseline plan submitted — a Super Admin must activate it");
      setOpen(false);
      setForm({ title: "", planned_start_date: "", planned_end_date: "", period_label: "", revision_reason: "" });
      setFile(null);
      setActivities([{ title: "", planned_start: "", planned_end: "", dependency: "" }]);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const onActivate = async (id: string) => {
    const note = window.prompt("Administrative note for this activation (optional)") ?? "";
    try {
      await activate.mutateAsync({ id, admin_note: note || null });
      toast.success("Baseline plan activated — the previous version is now archived");
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-lg">Baseline plan</h2>
          <p className="text-sm text-muted-foreground">
            The official execution programme. Once active it is locked — only a Super Admin can activate a replacement version.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" />{versions.length ? "Submit revised plan" : "Submit baseline plan"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Submit baseline plan {versions.length ? `V${versions.length + 1}` : "V1"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Planning title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Execution programme — contractual baseline" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Planned start</Label>
                    <Input type="date" value={form.planned_start_date}
                      onChange={(e) => setForm({ ...form, planned_start_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Planned completion</Label>
                    <Input type="date" value={form.planned_end_date}
                      onChange={(e) => setForm({ ...form, planned_end_date: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Planning period</Label>
                  <Input value={form.period_label} onChange={(e) => setForm({ ...form, period_label: e.target.value })}
                    placeholder="e.g. 18 months — phase 1" />
                </div>
                {versions.length > 0 && (
                  <div>
                    <Label>Reason for revision</Label>
                    <Textarea rows={2} value={form.revision_reason}
                      onChange={(e) => setForm({ ...form, revision_reason: e.target.value })}
                      placeholder="Why the programme is being replanned (agreed with the client)" />
                  </div>
                )}
                <div>
                  <Label>Planning file</Label>
                  <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </div>

                <div className="space-y-2">
                  <Label>Main activities / milestones</Label>
                  {activities.map((a, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                      <Input placeholder="Activity" value={a.title}
                        onChange={(e) => setActivities(activities.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} />
                      <Input type="date" className="w-36" value={a.planned_start}
                        onChange={(e) => setActivities(activities.map((x, j) => j === i ? { ...x, planned_start: e.target.value } : x))} />
                      <Input type="date" className="w-36" value={a.planned_end}
                        onChange={(e) => setActivities(activities.map((x, j) => j === i ? { ...x, planned_end: e.target.value } : x))} />
                      <Button size="icon" variant="ghost" onClick={() => setActivities(activities.filter((_, j) => j !== i))}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline"
                    onClick={() => setActivities([...activities, { title: "", planned_start: "", planned_end: "", dependency: "" }])}>
                    <Plus className="h-3 w-3 mr-1" />Add activity
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={onSubmit} disabled={submit.isPending}>
                  <FileUp className="h-4 w-4 mr-1" />Submit for activation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!active && (
        <div className="metric-card border-warning/40 bg-warning/5">
          <p className="text-sm font-medium">No active baseline plan</p>
          <p className="text-xs text-muted-foreground mt-1">
            The project stays out of execution mode until a Super Admin activates a submitted baseline plan.
          </p>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading planning history…</p>}

      <div className="space-y-3">
        {versions.map((v: any) => (
          <div key={v.id} className="metric-card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">V{v.version_no} — {v.title}</span>
                  <Badge className={statusTone[v.status]} variant="secondary">{v.status}</Badge>
                  {v.status === "active" && <Lock className="h-3.5 w-3.5 text-success" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {v.planned_start_date || "—"} → {v.planned_end_date || "—"}
                  {v.period_label ? ` · ${v.period_label}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(v.submitted_at).toLocaleString()}
                  {v.activated_at ? ` · activated ${new Date(v.activated_at).toLocaleDateString()}` : ""}
                  {v.archived_at ? ` · archived ${new Date(v.archived_at).toLocaleDateString()}` : ""}
                </p>
                {v.revision_reason && <p className="text-sm mt-1">Reason: {v.revision_reason}</p>}
                {v.admin_note && <p className="text-xs text-muted-foreground mt-1">Administrative note: {v.admin_note}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                  <History className="h-4 w-4 mr-1" />Activities
                </Button>
                {isSuperAdmin && v.status === "submitted" && (
                  <Button size="sm" onClick={() => onActivate(v.id)} disabled={activate.isPending}>
                    <ShieldCheck className="h-4 w-4 mr-1" />Activate
                  </Button>
                )}
              </div>
            </div>
            {expanded === v.id && <PlanActivityList planVersionId={v.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanActivityList({ planVersionId }: { planVersionId: string }) {
  const { data: activities = [] } = usePlanActivities(planVersionId);
  if (!activities.length) return <p className="text-xs text-muted-foreground mt-3">No structured activities recorded.</p>;
  return (
    <div className="mt-3 border-t pt-3 space-y-1">
      {activities.map((a: any) => (
        <div key={a.id} className="flex items-center justify-between text-sm">
          <span>{a.title}</span>
          <span className="text-xs text-muted-foreground">{a.planned_start || "—"} → {a.planned_end || "—"}</span>
        </div>
      ))}
    </div>
  );
}
