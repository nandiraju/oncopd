import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "border-transparent bg-primary/15 text-primary",
  gold: "border-gold/30 bg-gold/15 text-gold",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-border text-foreground",
  success: "border-transparent bg-emerald-500/15 text-emerald-400",
  warning: "border-transparent bg-amber-500/15 text-amber-400",
  danger: "border-transparent bg-red-500/15 text-red-400",
  info: "border-transparent bg-sky-500/15 text-sky-400",
  muted: "border-transparent bg-muted text-muted-foreground",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export function riskVariant(risk: string): keyof typeof variants {
  switch (risk) {
    case "Critical":
      return "danger";
    case "High":
      return "warning";
    case "Moderate":
      return "info";
    default:
      return "success";
  }
}

export function statusVariant(status: string): keyof typeof variants {
  const s = status.toLowerCase();
  if (/(critical|missed|distress|refractory|relapsed|urgent|stat)/.test(s)) return "danger";
  if (/(pending|hold|await|draft|requested|unread)/.test(s)) return "warning";
  if (/(reviewed|completed|approved|active|resulted|replied|finalized|complete response)/.test(s)) return "success";
  if (/(progress|scheduled|in review|checked in|in lab)/.test(s)) return "info";
  return "muted";
}
