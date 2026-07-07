import { Link } from "react-router-dom";
import { cn, initials } from "@/lib/utils";
import { Avatar } from "@/components/ui/misc";
import { Badge, riskVariant } from "@/components/ui/badge";
import type { Patient } from "@/lib/types";

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
  onClick,
  active,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "gold" | "danger" | "warning" | "info" | "success";
  hint?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const accentMap = {
    gold: "text-gold bg-gold/10",
    danger: "text-red-400 bg-red-500/10",
    warning: "text-amber-400 bg-amber-500/10",
    info: "text-sky-400 bg-sky-500/10",
    success: "text-emerald-400 bg-emerald-500/10",
  };
  const a = accentMap[accent ?? "gold"];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border bg-card/70 p-4 text-left transition-all card-shadow",
        onClick && "hover:border-gold/40 hover:bg-card cursor-pointer",
        active ? "border-gold/60 stat-glow" : "border-border/70"
      )}
    >
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", a)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-none tracking-tight">{value}</div>
        <div className="mt-1.5 text-xs text-muted-foreground">{label}</div>
      </div>
      {hint && <div className="ml-auto text-[11px] text-muted-foreground">{hint}</div>}
    </button>
  );
}

export function PatientCell({ patient, subtitle }: { patient: Patient; subtitle?: string }) {
  return (
    <Link to={`/patients/${patient.id}`} className="flex items-center gap-2.5 group">
      <Avatar className="h-8 w-8">{initials(patient.name)}</Avatar>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium group-hover:text-gold">{patient.name}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle ?? `${patient.mrn} · ${patient.cancerType}`}</div>
      </div>
    </Link>
  );
}

export function CancerBadge({ type }: { type: string }) {
  return <Badge variant="secondary" className="font-normal">{type}</Badge>;
}

export function RiskBadge({ risk }: { risk: string }) {
  return <Badge variant={riskVariant(risk)}>{risk}</Badge>;
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function FilterChip({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1 text-xs font-medium transition-all",
        active
          ? "border-gold/50 bg-gold/15 text-gold"
          : "border-border/70 bg-card/50 text-muted-foreground hover:border-gold/30 hover:text-foreground"
      )}
    >
      {label}
      {count != null && (
        <span className={cn("rounded-sm px-1.5 text-[10px]", active ? "bg-gold/25" : "bg-secondary")}>{count}</span>
      )}
    </button>
  );
}
