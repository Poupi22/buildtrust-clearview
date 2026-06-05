import { Users, Settings as SettingsIcon, Trash2, Search, Pencil, UserX, UserCheck, Loader2 } from "lucide-react";
import {
  useProjects,
  useProjectMembers,
  useAllProfiles,
  useRemoveMember,
  useIsAdmin,
} from "@/hooks/useBuildTrust";
import { AddMemberDialog } from "@/components/dialogs/AddMemberDialog";
import { CreateUserDialog } from "@/components/dialogs/CreateUserDialog";
import { EditUserDialog } from "@/components/dialogs/EditUserDialog";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Team() {
  const { data: projects = [] } = useProjects();
  const [selectedId, setSelectedId] = useState<string>("");
  const projectId = selectedId || projects[0]?.id;
  const { data: members = [] } = useProjectMembers(projectId);
  const { data: profiles = [] } = useAllProfiles();
  const remove = useRemoveMember();
  const isAdmin = useIsAdmin();

  const profileMap = new Map(profiles.map((p: any) => [p.user_id, p]));

  const onRemove = async (id: string) => {
    try {
      await remove.mutateAsync({ id });
      toast.success("Removed");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage members assigned to each project</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          
          <Select value={projectId ?? ""} onValueChange={setSelectedId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {projectId && isAdmin && <AddMemberDialog projectId={projectId} />}
        </div>
      </div>


      {!projectId ? (
        <div className="metric-card text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        </div>
      ) : members.length === 0 ? (
        <div className="metric-card text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No members on this project.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m: any) => {
            const p: any = profileMap.get(m.user_id);
            const initials = p?.avatar_initials ?? (p?.full_name ?? "U").split(" ").map((n: string) => n[0]).slice(0, 2).join("");
            return (
              <div key={m.id} className="metric-card flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{p?.full_name ?? m.user_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                </div>
                <StatusBadge status={m.role} />
                {isAdmin && (
                  <Button size="icon" variant="ghost" onClick={() => onRemove(m.id)} disabled={remove.isPending}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const isAdmin = useIsAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Company and application settings</p>
      </div>

      {isAdmin ? (
        <UserManagementSection />
      ) : (
        <div className="metric-card text-center py-12">
          <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-display font-bold">Settings</h3>
          <p className="text-sm text-muted-foreground mt-1">Only admins can manage users.</p>
        </div>
      )}
    </div>
  );
}

type AppRole = "super-admin" | "company-admin" | "engineer" | "technician" | "client";

interface UserRow {
  user_id: string;
  full_name: string | null;
  is_active: boolean;
  role: AppRole;
  project_count: number;
}

function useAllUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserRow[]> => {
      const [profilesRes, rolesRes, membersRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, is_active"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("project_members").select("user_id, project_id"),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;
      if (membersRes.error) throw membersRes.error;

      const roleMap = new Map<string, AppRole>();
      (rolesRes.data ?? []).forEach((r: any) => roleMap.set(r.user_id, r.role));
      const countMap = new Map<string, number>();
      (membersRes.data ?? []).forEach((m: any) => countMap.set(m.user_id, (countMap.get(m.user_id) ?? 0) + 1));

      return (profilesRes.data ?? []).map((p: any) => ({
        user_id: p.user_id,
        full_name: p.full_name,
        is_active: p.is_active !== false,
        role: roleMap.get(p.user_id) ?? "engineer",
        project_count: countMap.get(p.user_id) ?? 0,
      }));
    },
  });
}

function UserManagementSection() {
  const qc = useQueryClient();
  const { data: users = [], isLoading, refetch } = useAllUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && !u.is_active) return false;
      if (statusFilter === "inactive" && u.is_active) return false;
      if (q && !(u.full_name ?? "").toLowerCase().includes(q) && !u.user_id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, roleFilter, statusFilter]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["profiles"] });
    qc.invalidateQueries({ queryKey: ["project_members"] });
  };

  const toggleActive = async (u: UserRow) => {
    setBusyId(u.user_id);
    try {
      const { data, error } = await supabase.functions.invoke("manage-user", {
        body: { action: u.is_active ? "deactivate" : "reactivate", user_id: u.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(u.is_active ? "User deactivated" : "User reactivated");
      refresh();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusyId(null);
      setConfirmDeactivate(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="metric-card">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="font-display font-bold">User management</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create, edit, and deactivate users. A temporary password is shown once on creation or password reset.
            </p>
          </div>
          <CreateUserDialog onCreated={refresh} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name..." className="pl-8" />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="super-admin">Super admin</SelectItem>
              <SelectItem value="company-admin">Company admin</SelectItem>
              <SelectItem value="engineer">Engineer</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="metric-card text-center py-12">
          <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="metric-card text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No users match the filters.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const initials = (u.full_name ?? "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div key={u.user_id} className={`metric-card flex items-center gap-4 ${!u.is_active ? "opacity-60" : ""}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm truncate">{u.full_name || "(unnamed)"}</p>
                    {!u.is_active && <span className="text-[10px] uppercase tracking-wide bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Inactive</span>}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{u.role.replace("-", " ")} · {u.project_count} project{u.project_count === 1 ? "" : "s"}</p>
                </div>
                <StatusBadge status={u.role} />
                <Button size="icon" variant="ghost" onClick={() => setEditing(u)} title="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                {u.is_active ? (
                  <Button size="icon" variant="ghost" onClick={() => setConfirmDeactivate(u)} disabled={busyId === u.user_id} title="Deactivate">
                    <UserX className="h-4 w-4 text-destructive" />
                  </Button>
                ) : (
                  <Button size="icon" variant="ghost" onClick={() => toggleActive(u)} disabled={busyId === u.user_id} title="Reactivate">
                    {busyId === u.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4 text-success" />}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <EditUserDialog
          open={!!editing}
          onOpenChange={(v) => { if (!v) setEditing(null); }}
          user={editing}
          onSaved={refresh}
        />
      )}

      <AlertDialog open={!!confirmDeactivate} onOpenChange={(v) => { if (!v) setConfirmDeactivate(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeactivate?.full_name || "This user"} will no longer be able to sign in. You can reactivate them at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeactivate && toggleActive(confirmDeactivate)}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
