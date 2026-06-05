import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateProject, useIsAdmin, useClientUsers } from "@/hooks/useBuildTrust";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, FileUp, X } from "lucide-react";

type DocEntry = { file: File; title: string };

export function NewProjectDialog() {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", type: "", location: "", start_date: "", client_user_id: "" });
  const [docs, setDocs] = useState<DocEntry[]>([]);
  const createProject = useCreateProject();
  const { data: clients = [] } = useClientUsers();

  if (!isAdmin) return null;

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list).map((f) => ({
      file: f,
      title: f.name.replace(/\.[^.]+$/, ""),
    }));
    setDocs((prev) => [...prev, ...next]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast.error("Project title is required");
      return;
    }
    if (docs.some((d) => !d.title.trim())) {
      toast.error("Each document needs a title");
      return;
    }
    try {
      await createProject.mutateAsync({
        title: form.title,
        type: form.type || undefined,
        location: form.location || undefined,
        start_date: form.start_date || null,
        client_user_id: form.client_user_id || null,
        documents: docs.map((d) => ({ file: d.file, title: d.title.trim() })),
      });
      toast.success("Project created");
      setOpen(false);
      setForm({ title: "", type: "", location: "", start_date: "", client_user_id: "" });
      setDocs([]);
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
              onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
            />
            <p className="text-xs text-muted-foreground mt-1">Plans, estimates, contracts... Give each one a clear title.</p>
            {docs.length > 0 && (
              <ul className="mt-2 space-y-2">
                {docs.map((d, i) => (
                  <li key={i} className="rounded-md border bg-muted/30 p-2 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground truncate">{d.file.name}</span>
                      <button
                        type="button"
                        onClick={() => setDocs(docs.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      placeholder="Document title (e.g. Architectural plan v2)"
                      value={d.title}
                      onChange={(e) => {
                        const next = [...docs];
                        next[i] = { ...next[i], title: e.target.value };
                        setDocs(next);
                      }}
                    />
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
