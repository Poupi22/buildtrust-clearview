import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { FileText, Download, CalendarDays, Sun, Pencil, Trash2, Eye } from "lucide-react";
import { useReports, useProjects, useDeleteReport, useCanManageProject } from "@/hooks/useBuildTrust";
import { ReportFormDialog } from "@/components/dialogs/ReportFormDialog";
import { ReportReviewDialog } from "@/components/review/ReportReviewDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { generateJournalPdf } from "@/lib/reportPdf";
import { toast } from "sonner";

type Tab = "daily" | "weekly";

export default function Reports() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState<string>("");
  const [tab, setTab] = useState<Tab>("daily");
  const activeProjectId = projectId || projects[0]?.id;
  const project = projects.find((p: any) => p.id === activeProjectId);

  const { data: reports = [], isLoading } = useReports(activeProjectId);
  const del = useDeleteReport();

  const canManage = useCanManageProject(activeProjectId);

  const filtered = useMemo(
    () => reports.filter((r: any) => r.report_type === tab),
    [reports, tab],
  );

  const [viewing, setViewing] = useState<any | null>(null);
  const [editing, setEditing] = useState<any | null>(null);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    try { await del.mutateAsync(id); toast.success("Report deleted"); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const exportPdf = (type: "daily" | "weekly" | "all") => {
    if (!project) { toast.error("Pick a project first"); return; }
    generateJournalPdf(
      { title: project.title, location: (project as any).location },
      reports as any,
      { type, includeInternal: canManage },
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daily site journal &amp; weekly client-facing reports
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {projects.length > 1 && (
            <Select value={activeProjectId ?? ""} onValueChange={setProjectId}>
              <SelectTrigger className="w-56 h-9"><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Button variant="outline" size="sm" onClick={() => exportPdf(tab)}>
            <Download className="h-4 w-4 mr-1" /> Export {tab} PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportPdf("all")}>
            <Download className="h-4 w-4 mr-1" /> Full journal
          </Button>
          {activeProjectId && (
            <ReportFormDialog type={tab} defaultProjectId={activeProjectId} />
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="daily"><Sun className="h-4 w-4 mr-1" />Daily journal</TabsTrigger>
          <TabsTrigger value="weekly"><CalendarDays className="h-4 w-4 mr-1" />Weekly client reports</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Submitted daily by the field team. Visible to engineers and administrators only — never to the client.
          </p>
          <ReportList
            reports={filtered}
            currentUserId={user?.id}
            canManage={canManage}
            onView={setViewing}
            onEdit={setEditing}
            onDelete={onDelete}
          />
        </TabsContent>

        <TabsContent value="weekly" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            Submitted weekly. Engineers/administrators may edit; once validated and published, the report appears in the client portal.
          </p>
          <ReportList
            reports={filtered}
            currentUserId={user?.id}
            canManage={canManage}
            onView={setViewing}
            onEdit={setEditing}
            onDelete={onDelete}
            isWeekly
          />
        </TabsContent>
      </Tabs>

      {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}

      <ReportReviewDialog
        report={viewing}
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        canManage={canManage}
        onEdit={(r) => setEditing(r)}
      />


      {/* Edit dialog */}
      {editing && (
        <ReportFormDialog
          type={editing.report_type}
          existing={editing}
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          trigger={null as any}
        />
      )}
    </div>
  );
}

function ReportList({
  reports, currentUserId, canManage, onView, onEdit, onDelete, isWeekly,
}: {
  reports: any[];
  currentUserId?: string;
  canManage: boolean;
  onView: (r: any) => void;
  onEdit: (r: any) => void;
  onDelete: (id: string) => void;
  isWeekly?: boolean;
}) {
  if (reports.length === 0) {
    return (
      <div className="metric-card text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">No reports yet.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reports.map((r) => {
        const isAuthor = r.author_id === currentUserId;
        const state = r.state ?? r.status;
        const editable = state !== "approved";
        const canEdit = editable && (canManage || (isAuthor && ["draft", "pending", "rejected"].includes(state)));
        const canDelete = editable && (canManage || (isAuthor && ["draft", "pending", "rejected"].includes(state)));
        const dateLabel = r.report_type === "weekly" && r.week_start
          ? `${r.week_start} → ${r.week_end}`
          : r.report_date;
        return (
          <div key={r.id} className="metric-card">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <button onClick={() => onView(r)} className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{r.title || dateLabel}</span>
                  <StatusBadge status={state} />
                  {r.is_published && (
                    <span className="text-[10px] uppercase font-bold bg-success/15 text-success px-1.5 py-0.5 rounded">Visible to client</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{dateLabel}</p>
                {r.summary && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{r.summary}</p>}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" onClick={() => onView(r)} title="View">
                  <Eye className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button size="icon" variant="ghost" onClick={() => onEdit(r)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <Button size="icon" variant="ghost" onClick={() => onDelete(r.id)} className="text-destructive" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
