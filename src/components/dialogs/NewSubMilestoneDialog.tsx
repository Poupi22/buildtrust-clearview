import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateSubMilestone, useSubMilestones } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const UNITS = ["m²", "m³", "linear meter", "unit", "FF", "kg", "ton", "hour"];

export function NewSubMilestoneDialog({
  projectId, milestoneId,
}: { projectId: string; milestoneId: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [unit, setUnit] = useState("m²");
  const [target, setTarget] = useState<number>(0);
  const [contribution, setContribution] = useState<number>(0);
  const create = useCreateSubMilestone();
  const { data: subs = [] } = useSubMilestones(projectId, milestoneId);

  const used = subs.reduce((s, x: any) => s + Number(x.contribution_pct ?? 0), 0);
  const remaining = Math.max(0, 100 - used);

  const submit = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    if (!(target > 0)) { toast.error("Target must be > 0"); return; }
    if (contribution <= 0 || contribution > 100) { toast.error("Contribution must be 0-100"); return; }
    if (contribution > remaining + 0.001) { toast.error(`Only ${remaining}% remaining in milestone`); return; }
    try {
      await create.mutateAsync({
        project_id: projectId,
        milestone_id: milestoneId,
        title: title.trim(),
        unit,
        target_quantity: target,
        contribution_pct: contribution,
        ordering: subs.length,
      });
      toast.success("Sub-milestone created");
      setOpen(false);
      setTitle(""); setTarget(0); setContribution(0);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1" />Sub-milestone</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New sub-milestone</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tile installation" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target quantity</Label>
              <Input type="number" min={0} step={0.01} value={target} onChange={(e) => setTarget(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>Contribution to milestone (%)</Label>
            <Input type="number" min={0} max={100} step={0.5} value={contribution}
              onChange={(e) => setContribution(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">
              Used: {used}% · Remaining: {remaining}%
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
