import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateMilestone } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewMilestoneDialog({ projectId, nextOrder }: { projectId: string; nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [planned, setPlanned] = useState("");
  const create = useCreateMilestone();

  const submit = async () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }
    try {
      await create.mutateAsync({
        project_id: projectId,
        title: title.trim(),
        planned_date: planned || null,
        ordering: nextOrder,
      });
      toast.success("Milestone created");
      setOpen(false);
      setTitle("");
      setPlanned("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New milestone</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New milestone</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Foundations complete" />
          </div>
          <div>
            <Label>Planned date</Label>
            <Input type="date" value={planned} onChange={(e) => setPlanned(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
