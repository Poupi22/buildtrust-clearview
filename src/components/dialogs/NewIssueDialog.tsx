import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, useCreateIssue } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewIssueDialog({ defaultProjectId }: { defaultProjectId?: string }) {
  const [open, setOpen] = useState(false);
  const { data: projects = [] } = useProjects();
  const create = useCreateIssue();
  const [form, setForm] = useState({
    project_id: defaultProjectId ?? "",
    title: "",
    description: "",
    impact: "",
    severity: "medium" as "low" | "medium" | "high" | "critical",
  });

  const submit = async () => {
    if (!form.project_id || !form.title) {
      toast.error("Project and title required");
      return;
    }
    try {
      await create.mutateAsync(form);
      toast.success("Issue reported");
      setOpen(false);
      setForm({ ...form, title: "", description: "", impact: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Report Issue</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
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
          <div>
            <Label htmlFor="i-title">Title</Label>
            <Input id="i-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={form.severity} onValueChange={(v: any) => setForm({ ...form, severity: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="i-desc">Description</Label>
            <Textarea id="i-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="i-impact">Impact</Label>
            <Textarea id="i-impact" rows={2} value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={create.isPending}>Report issue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
