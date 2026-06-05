import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { getMediaUrl } from "@/hooks/useBuildTrust";
import { FileText, Download } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
  sub?: any;
  onApprove?: () => void;
  onReject?: () => void;
  actionsDisabled?: boolean;
}

export function ProgressReportDetailsDialog({
  open, onOpenChange, report, sub, onApprove, onReject, actionsDisabled,
}: Props) {
  const { data: media = [], isLoading } = useQuery({
    queryKey: ["media", "report", report?.id],
    enabled: open && !!report?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_files")
        .select("*")
        .eq("progress_report_id", report.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!report) return null;
  const showActions = !!(onApprove || onReject);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{sub?.title ?? "Progress report"}</span>
            <StatusBadge status={report.status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-semibold">{report.report_date}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Quantity reported</p>
              <p className="font-semibold">
                {report.quantity} {sub?.unit ?? ""}
              </p>
            </div>
            {sub && (
              <div className="col-span-2 rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Sub-milestone progress</p>
                <p className="font-semibold">
                  {sub.completed_quantity}/{sub.target_quantity} {sub.unit} ({sub.progress_pct}%)
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              Description
            </p>
            <p className="text-sm whitespace-pre-wrap">
              {report.description || <span className="text-muted-foreground italic">No description provided.</span>}
            </p>
          </div>

          {report.review_comment && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive mb-1">
                Review comment
              </p>
              <p className="text-sm italic">"{report.review_comment}"</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Attachments {media.length > 0 && `(${media.length})`}
            </p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : media.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No photos or files attached.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {media.map((f: any) => {
                  const url = getMediaUrl(f.storage_path);
                  const isImage = f.mime_type?.startsWith("image/");
                  return (
                    <a
                      key={f.id}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative rounded-lg overflow-hidden border bg-muted/30 aspect-square block"
                    >
                      {isImage ? (
                        <img
                          src={url}
                          alt={f.caption ?? ""}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground p-2">
                          <FileText className="h-8 w-8" />
                          <span className="text-[10px] truncate w-full text-center">
                            {f.storage_path.split("/").pop()}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-sm">
                        <Download className="h-3.5 w-3.5" />
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {showActions ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              {onReject && (
                <Button variant="destructive" onClick={onReject} disabled={actionsDisabled}>
                  Reject
                </Button>
              )}
              {onApprove && (
                <Button
                  className="bg-success hover:bg-success/90 text-success-foreground"
                  onClick={onApprove}
                  disabled={actionsDisabled}
                >
                  Approve & Count
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
