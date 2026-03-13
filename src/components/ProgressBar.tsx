import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({ value, className, size = "md" }: ProgressBarProps) {
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  const clamped = Math.min(100, Math.max(0, value));
  const color = clamped >= 75 ? "bg-success" : clamped >= 40 ? "bg-primary" : clamped >= 20 ? "bg-accent" : "bg-muted-foreground";

  return (
    <div className={cn("w-full rounded-full bg-muted", heights[size], className)}>
      <div
        className={cn("rounded-full transition-all duration-500", heights[size], color)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
