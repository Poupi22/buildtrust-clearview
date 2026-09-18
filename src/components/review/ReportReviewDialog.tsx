import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { CheckCircle2, Pencil, XCircle } from "lucide-react";
import { useReviewReport } from "@/hooks/useBuildTrust";
import { toast } from "sonner";

/**
 * The single review surface for daily & weekly reports.
 * Used by the Reports page, the Approvals queue and the project page so that
 * one decision always produces the same record.
 */
export function ReportReviewDialog({
  report, open, onOpenChange, canManage, onEdit,
}: {
  report: any | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  canManage: boolean;
  onEdit?: (r: any) => void;
}) {
  const review = useReviewReport();
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  if (!report) return null;

  const state = report.state ?? report.status;
  const isApproved = state === "approved";
  const isWeekly = report.report_type === "weekly";
  const dateLabel = isWeekly && report.week_start
    ? `${report.week_start} → ${report.week_end}`
    : report.report_date;

  const decide = async (decision: "approved" | "rejected") => {
    if (decision === "rejected" && !rejecting) { setRejecting(true); return; }
    try {
      await review.mutateAsync({
        id: report.id,
        project_id: report.project_id,
        decision,
        reason: reason.trim() || null,
      });
      toast.success(
        decision === "approved"
          ? (isWeekly ? "Approved and published to the client" : "Report approved")
          : "Report rejected — the author can revise and resubmit",
      );
      setReason(""); setRejecting(false);
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message ?? "Failed"); }
  };

  const Section = ({ label, body }: { label: string; body?: string | null }) =>
    body ? (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm whitespace-pre-wrap">{body}</p>
      </div>
    ) : null;

  const Rows = ({ label, rows, cols }: { label: string; rows: any[]; cols: string[] }) =>
    Array.isArray(rows) && rows.length > 0 ? (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <div className="rounded-lg border divide-y text-sm">
          {rows.map((r, i) => (
            <div key={i} className="flex gap-3 px-3 py-1.5">
              {cols.map((c) => <span key={c} className="flex-1 min-w-0 truncate">{String(r?.[c] ?? "")}</span>)}
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setReason(""); setRejecting(false); } onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded font-bold">
              {report.report_type ?? "daily"}
            </span>
            <span>{report.title || dateLabel}</span>
            <StatusBadge status={state} />
            {report.is_published && (
              <span className="text-[10px] uppercase font-bold bg-success/15 text-success px-1.5 py-0.5 rounded">
                Visible to client
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span>{dateLabel}</span>
            {report.weather && <span>Weather: {report.weather}</span>}
            {report.work_area && <span>Area: {report.work_area}</span>}
            {report.work_start_time && <span>{report.work_start_time} → {report.work_end_time}</span>}
          </div>
          <Section label="Summary" body={report.summary} />
          <Rows label="Personnel" rows={report.personnel} cols={["poste", "nombre"]} />
          <Rows label="Matériel" rows={report.equipment} cols={["designation", "utilisation"]} />
          <Rows label="Travaux réalisés" rows={report.works_done} cols={["designation", "observations"]} />
          <Rows label="Consommation matériaux" rows={report.materials} cols={["designation", "stock_matin", "approvisionnement", "consomme", "stock_soir"]} />
          <Section label="Achievements" body={report.achievements} />
          <Section label="Challenges / blockers" body={report.challenges} />
          <Section label={isWeekly ? "Plan for next week" : "Next-day activities"} body={report.next_plan} />
          <Section label="Instructions du Maître de l'Ouvrage" body={report.owner_instructions} />
          <Section label="Instructions de la Mission de Contrôle" body={report.supervision_instructions} />
          <Section label="HSE observations" body={report.safety_observations} />
          <Section label="Technical observations" body={report.technical_observations} />
          <Section label="Corrective actions" body={report.corrective_actions} />
          <Section label="Delays" body={report.delays} />
          {canManage && <Section label="Internal notes" body={report.notes} />}
          {report.review_comment && <Section label="Review comment" body={report.review_comment} />}
        </div>

        {canManage && !isApproved && (
          <div className="space-y-2 pt-2 border-t">
            {rejecting && (
              <Textarea
                rows={2}
                placeholder="Reason for rejection (shared with the author)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}
            <div className="flex gap-2 justify-end flex-wrap">
              {onEdit && (
                <Button variant="outline" onClick={() => { onEdit(report); onOpenChange(false); }}>
                  <Pencil className="h-4 w-4 mr-1" />Edit
                </Button>
              )}
              <Button variant="destructive" onClick={() => decide("rejected")} disabled={review.isPending}>
                <XCircle className="h-4 w-4 mr-1" />{rejecting ? "Confirm rejection" : "Reject"}
              </Button>
              {!rejecting && (
                <Button onClick={() => decide("approved")} disabled={review.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  {isWeekly ? "Approve & publish" : "Approve"}
                </Button>
              )}
            </div>
          </div>
        )}
        {isApproved && (
          <p className="text-xs text-muted-foreground border-t pt-2">
            Approved on {report.reviewed_at?.slice(0, 10)} — this report is final and can no longer be edited or rejected.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
