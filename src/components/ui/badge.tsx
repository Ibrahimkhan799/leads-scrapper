import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "outline" | "hot" | "high" | "medium" | "low";
}) {
  const styles = {
    default: "bg-primary/10 text-primary",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border",
    hot: "bg-rose-500/15 text-rose-600 dark:text-rose-300",
    high: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    low: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        styles[variant],
        className
      )}
      {...props}
    />
  );
}
