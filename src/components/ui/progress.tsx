import * as React from "react";
import { cn } from "@/lib/utils";

const colorVariants = {
  default: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
};

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: keyof typeof colorVariants;
}

function Progress({
  className,
  value,
  max = 100,
  label,
  showPercentage = false,
  color = "default",
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)} {...props}>
      {(label || showPercentage) && (
        <div className="mb-1 flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress"}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-in-out",
            colorVariants[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export { Progress };
