import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, useCreateReport } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewReportDialog({ defaultProjectId }: { defaultProjectId?: string }) {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const create = useCreateReport();
  const [form, setForm] = useState({
    project_id: defaultProjectId ?? "",
    report_date: new Date().toISOString().slice(0, 10),
    weather: "",
    workforce_count: 0,
    tasks: "",
    notes: "",
  });

  const submit = async (status: "draft" | "submitted") => {
    if (!form.project_id) {
      toast.error("Select a project");
      return;
    }
    try {
      await create.mutateAsync({
        project_id: form.project_id,
        report_date: form.report_date,
        weather: form.weather,
        workforce_count: Number(form.workforce_count) || 0,
        tasks_completed: form.tasks.split("\n").map((s) => s.trim()).filter(Boolean),
        notes: form.notes,
        status,
      });
      toast.success(status === "submitted" ? "Report submitted" : "Draft saved");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Report</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New daily report</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {!defaultProjectId && (
            <div>
              <Label>Project</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="r-date">Date</Label>
              <Input id="r-date" type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="r-weather">Weather</Label>
              <Input id="r-weather" placeholder="Sunny, 30°C" value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="r-workforce">Workforce count</Label>
            <Input id="r-workforce" type="number" value={form.workforce_count} onChange={(e) => setForm({ ...form, workforce_count: Number(e.target.value) })} />
          </div>
          <div>
            <Label htmlFor="r-tasks">Tasks completed (one per line)</Label>
            <Textarea id="r-tasks" rows={4} value={form.tasks} onChange={(e) => setForm({ ...form, tasks: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="r-notes">Notes</Label>
            <Textarea id="r-notes" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => submit("draft")} disabled={create.isPending}>Save draft</Button>
          <Button onClick={() => submit("submitted")} disabled={create.isPending}>Submit for review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
