import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectMembers, useAllProfiles, useMilestones } from "@/hooks/useBuildTrust";
import { useCreateTask, TaskPriority } from "@/hooks/useTasks";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

export function AssignTaskDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("normal");
  const [milestoneId, setMilestoneId] = useState("");

  const { data: members = [] } = useProjectMembers(projectId);
  const { data: profiles = [] } = useAllProfiles();
  const { data: milestones = [] } = useMilestones(projectId);
  const create = useCreateTask();

  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));
  // assignable members: technicians/engineers/managers (not clients)
  const assignable = members.filter((m: any) => m.role !== "client" && m.role !== "viewer");

  const submit = async () => {
    if (!assignee) { toast.error("Pick an assignee"); return; }
    if (!title.trim()) { toast.error("Title is required"); return; }
    try {
      await create.mutateAsync({
        project_id: projectId,
        assigned_to: assignee,
        title: title.trim(),
        description: description || undefined,
        due_date: dueDate || null,
        priority,
        milestone_id: milestoneId || null,
      });
      toast.success("Task assigned");
      setOpen(false);
      setAssignee(""); setTitle(""); setDescription(""); setDueDate(""); setPriority("normal"); setMilestoneId("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><ClipboardList className="h-4 w-4 mr-1" />Assign task</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Assign a task</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Assignee *</Label>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger><SelectValue placeholder="Pick a team member" /></SelectTrigger>
              <SelectContent>
                {assignable.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">No assignable members on this project.</div>}
                {assignable.map((m: any) => {
                  const p: any = profileMap.get(m.user_id);
                  return (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {(p?.full_name || m.user_id.slice(0, 8))} · {m.role}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pour foundation slab section B" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Related milestone (optional)</Label>
            <Select value={milestoneId || "none"} onValueChange={(v) => setMilestoneId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {milestones.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={create.isPending}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
