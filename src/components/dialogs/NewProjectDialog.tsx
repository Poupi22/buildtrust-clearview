import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateProject, useIsAdmin } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus, FileUp, X } from "lucide-react";

export function NewProjectDialog() {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "", location: "", start_date: "" });
  const [files, setFiles] = useState<File[]>([]);
  const createProject = useCreateProject();

  if (!isAdmin) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    try {
      await createProject.mutateAsync({
        title: form.title,
        type: form.type || undefined,
        location: form.location || undefined,
        start_date: form.start_date || null,
        documents: files,
      });
      toast.success("Project created");
      setOpen(false);
      setForm({ title: "", type: "", location: "", start_date: "" });
      setFiles([]);
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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>A project ID will be generated automatically.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type">Type</Label>
              <Input id="type" placeholder="Residential, Bridge..." value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="start_date">Expected start date</Label>
              <Input id="start_date" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="docs" className="flex items-center gap-1.5">
              <FileUp className="h-4 w-4" /> Project documents
            </Label>
            <Input
              id="docs"
              type="file"
              multiple
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.dwg"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            />
            <p className="text-xs text-muted-foreground mt-1">Construction plans, estimates, contracts...</p>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
