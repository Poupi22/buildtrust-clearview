import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "status-draft" },
  submitted: { label: "Submitted", className: "status-submitted" },
  "under-review": { label: "Under Review", className: "status-review" },
  approved: { label: "Approved", className: "status-approved" },
  rejected: { label: "Rejected", className: "status-rejected" },
  published: { label: "Published", className: "status-published" },
  pending: { label: "Pending", className: "status-draft" },
  "in-progress": { label: "In Progress", className: "status-submitted" },
  completed: { label: "Completed", className: "status-approved" },
  delayed: { label: "Delayed", className: "status-rejected" },
  active: { label: "Active", className: "status-approved" },
  "on-hold": { label: "On Hold", className: "status-review" },
  planning: { label: "Planning", className: "status-draft" },
  open: { label: "Open", className: "status-rejected" },
  resolved: { label: "Resolved", className: "status-approved" },
  closed: { label: "Closed", className: "status-draft" },
  low: { label: "Low", className: "status-draft" },
  medium: { label: "Medium", className: "status-review" },
  high: { label: "High", className: "status-rejected" },
  critical: { label: "Critical", className: "bg-destructive text-destructive-foreground" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = statusConfig[status] || { label: status, className: "status-draft" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", config.className, className)}>
      {config.label}
    </span>
  );
}
