import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "border-transparent bg-primary text-primary-foreground shadow",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground shadow",
  outline: "text-foreground",
  success: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  warning: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  info: "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
