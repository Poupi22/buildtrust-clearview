import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllProfiles, useAddMember, useProjectMembers } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

export function AddMemberDialog({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"manager" | "engineer" | "client">("engineer");
  const { data: profiles = [] } = useAllProfiles();
  const { data: existing = [] } = useProjectMembers(projectId);
  const add = useAddMember();

  const existingIds = new Set(existing.map((m: any) => m.user_id));
  const available = profiles.filter((p: any) => !existingIds.has(p.user_id));

  const submit = async () => {
    if (!userId) { toast.error("Pick a user"); return; }
    try {
      await add.mutateAsync({ project_id: projectId, user_id: userId, role });
      toast.success("Member added");
      setOpen(false);
      setUserId("");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="h-4 w-4 mr-1" />Add member</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add team member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>User</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger><SelectValue placeholder="Pick a user" /></SelectTrigger>
              <SelectContent>
                {available.map((p: any) => (
                  <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.user_id.slice(0, 8)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="client">Client</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={add.isPending}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
