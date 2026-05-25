import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreateProgressReport, useProgressReports } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function SubmitProgressReportDialog({
  projectId, sub,
}: { projectId: string; sub: any }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [photos, setPhotos] = useState<File[]>([]);
  const create = useCreateProgressReport();
  const { data: reports = [], refetch } = useProgressReports({ subMilestoneId: sub.id });

  useEffect(() => { if (open) refetch(); }, [open, refetch]);

  const pendingQty = reports
    .filter((r: any) => r.status === "submitted")
    .reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);
  const approvedQty = Number(sub.completed_quantity || 0);
  const target = Number(sub.target_quantity);
  const remainingQty = Math.max(0, +(target - approvedQty - pendingQty).toFixed(4));
  const completed = sub.progress_pct >= 100 || remainingQty <= 0;

  const submit = async () => {
    if (!(quantity > 0)) { toast.error("Quantity must be > 0"); return; }
    if (quantity > remainingQty + 0.0001) {
      toast.error(`Only ${remainingQty} ${sub.unit} remaining to report`);
      return;
    }
    try {
      await create.mutateAsync({
        project_id: projectId,
        sub_milestone_id: sub.id,
        quantity,
        description,
        report_date: date,
        photos,
      });
      toast.success("Progress report submitted for review");
      setOpen(false);
      setQuantity(0); setDescription(""); setPhotos([]);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" disabled={completed}>
          <Plus className="h-3 w-3 mr-1" />Report progress
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report progress · {sub.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-0.5">
            <p>Target: <span className="font-semibold">{target} {sub.unit}</span></p>
            <p>Approved: <span className="font-semibold">{approvedQty} {sub.unit}</span> ({sub.progress_pct}%)</p>
            {pendingQty > 0 && (
              <p>Pending review: <span className="font-semibold">{pendingQty} {sub.unit}</span></p>
            )}
            <p>Remaining to report: <span className="font-semibold text-primary">{remainingQty} {sub.unit}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Quantity ({sub.unit}) · max {remainingQty}</Label>
              <Input type="number" min={0} max={remainingQty} step={0.01} value={quantity}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setQuantity(v > remainingQty ? remainingQty : v);
                }} />
            </div>
          </div>
          <div>
            <Label>Description / notes</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What was done, where, with whom..." />
          </div>
          <div>
            <Label>Photos / evidence</Label>
            <Input type="file" accept="image/*,application/pdf" multiple
              onChange={(e) => setPhotos(Array.from(e.target.files ?? []))} />
            {photos.length > 0 && <p className="text-xs text-muted-foreground mt-1">{photos.length} file(s) selected</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Submit for review</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
