import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/MetricCard";
import { AlertOctagon, CalendarCheck, CalendarX, Gauge, ShieldAlert } from "lucide-react";
import { useProjects, useReports, useIsSuperAdmin } from "@/hooks/useBuildTrust";
import { useObligations, useComplianceEvents, useAnnotateComplianceEvent } from "@/hooks/usePlanning";
import { toast } from "sonner";

export default function Compliance() {
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const scoped = projectId === "all" ? undefined : projectId;

  const { data: obligations = [] } = useObligations(scoped);
  const { data: events = [] } = useComplianceEvents(scoped);
  const { data: reports = [] } = useReports(scoped);
  const isSuperAdmin = useIsSuperAdmin();
  const annotate = useAnnotateComplianceEvent();

  const inRange = (d: string) => (!from || d >= from) && (!to || d <= to);

  const stats = useMemo(() => {
    const obs = (obligations as any[]).filter((o) => inRange(o.due_date));
    const daily = obs.filter((o) => o.kind === "daily");
    const weekly = obs.filter((o) => o.kind === "weekly");
    const onTime = (list: any[]) => list.filter((o) => o.status === "submitted" || o.status === "approved").length;
    const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
    const reps = (reports as any[]).filter((r) => inRange(r.report_date));
    return {
      dailyExpected: daily.length,
      dailyOnTime: onTime(daily),
      dailyAbsent: daily.filter((o) => o.status === "absent").length,
      dailyRate: pct(onTime(daily), daily.length),
      weeklyExpected: weekly.length,
      weeklyOnTime: onTime(weekly),
      weeklyAbsent: weekly.filter((o) => o.status === "absent").length,
      weeklyRate: pct(onTime(weekly), weekly.length),
      approved: reps.filter((r) => r.state === "approved").length,
      rejected: reps.filter((r) => r.state === "rejected").length,
      pending: obs.filter((o) => o.status === "pending").length,
    };
  }, [obligations, reports, from, to]);

  const filteredEvents = (events as any[]).filter((e) => inRange(e.event_date));

  const addNote = async (id: string) => {
    const note = window.prompt("Administrative explanation (the compliance record itself is never rewritten)");
    if (!note) return;
    try { await annotate.mutateAsync({ id, admin_note: note }); toast.success("Note recorded"); }
    catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Reporting compliance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Objective measurement of what was required, what was reported on time, and what was missed.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-xs">Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="w-56 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {(projects as any[]).map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">From</Label>
          <Input type="date" className="h-9 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">To</Label>
          <Input type="date" className="h-9 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Daily reporting compliance" value={`${stats.dailyRate}%`}
          subtitle={`${stats.dailyOnTime}/${stats.dailyExpected} submitted`} icon={<Gauge className="h-5 w-5" />} />
        <MetricCard title="Weekly reporting compliance" value={`${stats.weeklyRate}%`}
          subtitle={`${stats.weeklyOnTime}/${stats.weeklyExpected} submitted`} icon={<CalendarCheck className="h-5 w-5" />} />
        <MetricCard title="Absent daily reports" value={String(stats.dailyAbsent)}
          subtitle="Permanent non-compliance records" icon={<CalendarX className="h-5 w-5" />} />
        <MetricCard title="Absent weekly reports" value={String(stats.weeklyAbsent)}
          subtitle="Weekly cycles marked non-compliant" icon={<AlertOctagon className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Obligations still open" value={String(stats.pending)} subtitle="Awaiting submission" icon={<ShieldAlert className="h-5 w-5" />} />
        <MetricCard title="Approved reports" value={String(stats.approved)} subtitle="Official project records" icon={<CalendarCheck className="h-5 w-5" />} />
        <MetricCard title="Rejected reports" value={String(stats.rejected)} subtitle="Require a corrected version" icon={<AlertOctagon className="h-5 w-5" />} />
      </div>

      <div>
        <h2 className="font-display font-bold text-lg mb-3">Compliance events</h2>
        {filteredEvents.length === 0 ? (
          <div className="metric-card text-center py-10 text-sm text-muted-foreground">No non-compliance recorded for this filter.</div>
        ) : (
          <div className="space-y-2">
            {filteredEvents.map((e) => (
              <div key={e.id} className="metric-card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-sm capitalize">{e.event_type.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{e.event_date} · recorded {new Date(e.created_at).toLocaleString()}</p>
                    {e.detail && <p className="text-sm mt-1">{e.detail}</p>}
                    {e.admin_note && <p className="text-xs mt-1 text-muted-foreground">Administrative note: {e.admin_note}</p>}
                  </div>
                  {isSuperAdmin && (
                    <Button size="sm" variant="outline" onClick={() => addNote(e.id)}>Add administrative note</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
