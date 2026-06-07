import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  report: any | null;
}

export function WeeklyReportDetailsDialog({ open, onOpenChange, report }: Props) {
  if (!report) return null;
  const Section = ({ label, body }: { label: string; body?: string | null }) =>
    body ? (
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-sm whitespace-pre-wrap">{body}</p>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{report.title || `Week of ${report.week_start} → ${report.week_end}`}</span>
            <StatusBadge status={report.status} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {report.week_start} → {report.week_end}
            {report.is_published && " · Published to client"}
          </p>
          <Section label="Summary" body={report.summary} />
          <Section label="Achievements" body={report.achievements} />
          <Section label="Challenges / blockers" body={report.challenges} />
          <Section label="Plan for next week" body={report.next_plan} />
          {report.review_comment && <Section label="Review comment" body={report.review_comment} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
