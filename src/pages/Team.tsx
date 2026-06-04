import { Users, Settings as SettingsIcon, Trash2 } from "lucide-react";
import {
  useProjects,
  useProjectMembers,
  useAllProfiles,
  useRemoveMember,
  useIsAdmin,
} from "@/hooks/useBuildTrust";
import { AddMemberDialog } from "@/components/dialogs/AddMemberDialog";
import { CreateUserDialog } from "@/components/dialogs/CreateUserDialog";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
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
        <div className="flex items-center gap-2">
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
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Company and application settings</p>
      </div>
      <div className="metric-card text-center py-12">
        <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h3 className="font-display font-bold">Settings</h3>
        <p className="text-sm text-muted-foreground mt-1">Coming soon.</p>
      </div>
    </div>
  );
}
