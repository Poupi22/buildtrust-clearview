import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useCreateMilestone, useMilestones } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function NewMilestoneDialog({ projectId, nextOrder }: { projectId: string; nextOrder: number }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [planned, setPlanned] = useState("");
  const [contribution, setContribution] = useState<number>(0);
  const create = useCreateMilestone();
  const { data: milestones = [] } = useMilestones(projectId);

  const usedContribution = milestones.reduce((s: number, m: any) => s + Number(m.contribution_pct ?? 0), 0);
  const remaining = Math.max(0, 100 - usedContribution);

  const submit = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    if (contribution < 0 || contribution > 100) { toast.error("Contribution must be 0-100"); return; }
    if (contribution > remaining + 0.001) { toast.error(`Only ${remaining}% remaining in project`); return; }
    try {
      await create.mutateAsync({
        project_id: projectId,
        title: title.trim(),
        planned_date: planned || null,
        ordering: nextOrder,
        contribution_pct: contribution,
      });
      toast.success("Milestone created");
      setOpen(false);
      setTitle(""); setPlanned(""); setContribution(0);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Foundation" />
          </div>
          <div>
            <Label>Planned date</Label>
            <Input type="date" value={planned} onChange={(e) => setPlanned(e.target.value)} />
          </div>
          <div>
            <Label>Contribution to project (%)</Label>
            <Input type="number" min={0} max={100} step={0.5} value={contribution}
              onChange={(e) => setContribution(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">
              Used: {usedContribution}% · Remaining: {remaining}%
            </p>
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
