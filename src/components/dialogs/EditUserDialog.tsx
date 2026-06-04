import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useProjects } from "@/hooks/useBuildTrust";
import { toast } from "sonner";
import { Loader2, Copy, Check, KeyRound } from "lucide-react";

type AppRole = "super-admin" | "company-admin" | "engineer" | "technician" | "client";
type ProjectMemberRole = "owner" | "manager" | "engineer" | "client" | "technician";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: {
    user_id: string;
    full_name: string | null;
    role: AppRole;
    is_active: boolean;
  };
  onSaved: () => void;
}

export function EditUserDialog({ open, onOpenChange, user, onSaved }: Props) {
  const [fullName, setFullName] = useState(user.full_name ?? "");
  const [role, setRole] = useState<AppRole>(user.role);
  const [assignments, setAssignments] = useState<Record<string, ProjectMemberRole>>({});
  const [loading, setLoading] = useState(false);
  const [tempPwd, setTempPwd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: projects = [] } = useProjects();

  useEffect(() => {
    if (!open) return;
    setFullName(user.full_name ?? "");
    setRole(user.role);
    setTempPwd(null);
    (async () => {
      const { data } = await supabase
        .from("project_members")
        .select("project_id, role")
        .eq("user_id", user.user_id);
      const map: Record<string, ProjectMemberRole> = {};
      (data ?? []).forEach((r: any) => { map[r.project_id] = r.role; });
      setAssignments(map);
    })();
  }, [open, user.user_id]);

  const projectIds = useMemo(() => Object.keys(assignments), [assignments]);

  const toggleProject = (id: string, checked: boolean) => {
    setAssignments((prev) => {
      const next = { ...prev };
      if (checked) next[id] = next[id] ?? "engineer";
      else delete next[id];
      return next;
    });
  };

  const save = async () => {
    setLoading(true);
    try {
      const calls: Promise<any>[] = [];
      if (fullName !== (user.full_name ?? "")) {
        calls.push(supabase.functions.invoke("manage-user", { body: { action: "update_profile", user_id: user.user_id, full_name: fullName } }));
      }
      if (role !== user.role) {
        calls.push(supabase.functions.invoke("manage-user", { body: { action: "update_role", user_id: user.user_id, role } }));
      }
      calls.push(supabase.functions.invoke("manage-user", {
        body: {
          action: "set_project_assignments",
          user_id: user.user_id,
          project_assignments: Object.entries(assignments).map(([project_id, r]) => ({ project_id, role: r })),
        },
      }));
      const results = await Promise.all(calls);
      for (const r of results) {
        if (r.error) throw r.error;
        if (r.data?.error) throw new Error(r.data.error);
      }
      toast.success("User updated");
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { action: "reset_password", user_id: user.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTempPwd(data.password);
      toast.success("Password reset — share it with the user");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>Update role, project assignments, or reset access.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="eu-name">Full name</Label>
            <Input id="eu-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="technician">Technician</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="company-admin">Company admin</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="super-admin">Super admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Project assignments</Label>
            {projects.length === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">No projects yet.</p>
            ) : (
              <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
                {projects.map((p: any) => {
                  const checked = p.id in assignments;
                  return (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox id={`p-${p.id}`} checked={checked} onCheckedChange={(c) => toggleProject(p.id, !!c)} />
                      <Label htmlFor={`p-${p.id}`} className="flex-1 cursor-pointer text-sm">{p.title}</Label>
                      {checked && (
                        <Select value={assignments[p.id]} onValueChange={(v) => setAssignments((prev) => ({ ...prev, [p.id]: v as ProjectMemberRole }))}>
                          <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="engineer">Engineer</SelectItem>
                            <SelectItem value="technician">Technician</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">{projectIds.length} project(s) assigned</p>
          </div>

          {tempPwd && (
            <div className="rounded-lg border bg-success/5 p-3 space-y-2">
              <Label className="text-xs flex items-center gap-1"><KeyRound className="h-3 w-3" />New temporary password</Label>
              <div className="flex gap-2">
                <Input readOnly value={tempPwd} className="font-mono text-xs" />
                <Button size="icon" variant="outline" onClick={async () => { await navigator.clipboard.writeText(tempPwd); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
          <Button variant="outline" onClick={resetPassword} disabled={loading}>
            <KeyRound className="h-4 w-4 mr-1" />Reset password
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
