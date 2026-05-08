import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProject } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewProjectDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", code: "", client_name: "", type: "", location: "", planned_end_date: "" });
  const createProject = useCreateProject();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.code) {
      toast.error("Title and code are required");
      return;
    }
    try {
      await createProject.mutateAsync({
        ...form,
        planned_end_date: form.planned_end_date || null,
      });
      toast.success("Project created");
      setOpen(false);
      setForm({ title: "", code: "", client_name: "", type: "", location: "", planned_end_date: "" });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 transition-colors">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="code">Code *</Label>
              <Input id="code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Input id="type" placeholder="Residential, Bridge..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="client_name">Client name</Label>
            <Input id="client_name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="planned_end_date">Target date</Label>
              <Input id="planned_end_date" type="date" value={form.planned_end_date} onChange={(e) => setForm({ ...form, planned_end_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createProject.isPending}>
              {createProject.isPending ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
