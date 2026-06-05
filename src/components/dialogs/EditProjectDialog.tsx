import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUpdateProject } from "@/hooks/useBuildTrust";
import { UploadMediaDialog } from "@/components/dialogs/UploadMediaDialog";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

export function EditProjectDialog({ project }: { project: any }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: project.title ?? "",
    type: project.type ?? "",
    location: project.location ?? "",
    start_date: project.start_date ?? "",
    planned_end_date: project.planned_end_date ?? "",
    client_name: project.client_name ?? "",
    current_phase: project.current_phase ?? "",
  });
  const update = useUpdateProject();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await update.mutateAsync({
        id: project.id,
        patch: {
          title: form.title,
          type: form.type || null,
          location: form.location || null,
          start_date: form.start_date || null,
          planned_end_date: form.planned_end_date || null,
          client_name: form.client_name || null,
          current_phase: form.current_phase || null,
        },
      });
      toast.success("Project updated");
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="h-4 w-4 mr-1" />
          Edit project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </div>
            <div>
              <Label>Current phase</Label>
              <Input value={form.current_phase} onChange={(e) => setForm({ ...form, current_phase: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label>Client name</Label>
            <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label>Target end date</Label>
              <Input type="date" value={form.planned_end_date} onChange={(e) => setForm({ ...form, planned_end_date: e.target.value })} />
            </div>
          </div>
          <div className="pt-2 border-t">
            <Label className="block mb-2">Add project documents</Label>
            <UploadMediaDialog projectId={project.id} />
            <p className="text-xs text-muted-foreground mt-2">
              Plans, estimates and other documents appear in the Photos tab.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
