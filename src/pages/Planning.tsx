import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects, useCanManageProject } from "@/hooks/useBuildTrust";
import { BaselinePlanPanel } from "@/components/planning/BaselinePlanPanel";
import { WeeklyWorkPlanPanel } from "@/components/planning/WeeklyWorkPlanPanel";

export default function Planning() {
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState("");
  const activeProjectId = projectId || (projects as any[])[0]?.id;
  const canManage = useCanManageProject(activeProjectId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Planning</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Baseline programme and weekly commitments — the reference against which execution is measured.
          </p>
        </div>
        {projects.length > 1 && (
          <Select value={activeProjectId ?? ""} onValueChange={setProjectId}>
            <SelectTrigger className="w-60 h-9"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {(projects as any[]).map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {!activeProjectId ? (
        <div className="metric-card text-center py-12 text-sm text-muted-foreground">No project available yet.</div>
      ) : (
        <Tabs defaultValue="baseline">
          <TabsList>
            <TabsTrigger value="baseline">Baseline plan</TabsTrigger>
            <TabsTrigger value="weekly">Weekly work plans</TabsTrigger>
          </TabsList>
          <TabsContent value="baseline" className="mt-4">
            <BaselinePlanPanel projectId={activeProjectId} canManage={canManage} />
          </TabsContent>
          <TabsContent value="weekly" className="mt-4">
            <WeeklyWorkPlanPanel projectId={activeProjectId} canManage={canManage} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
