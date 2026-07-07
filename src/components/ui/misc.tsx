import * as React from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Separator({ className, orientation = "horizontal" }: { className?: string; orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
    />
  );
}

export function Avatar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-navy-light text-xs font-semibold text-foreground ring-1 ring-border",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Progress({ value, className, barClassName }: { value: number; className?: string; barClassName?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-sm bg-secondary", className)}>
      <div
        className={cn("h-full rounded-sm bg-gradient-to-r from-gold to-indigo-500 transition-all", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-xs font-medium text-muted-foreground", className)} {...props} />;
}

export function EmptyState({ icon, title, hint }: { icon?: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
      {icon && <div className="text-gold/60">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-xs">{hint}</p>}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)}>{children}</table>
    </div>
  );
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur [&_th]:text-muted-foreground">{children}</thead>;
}
export function TR({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={cn("border-b border-border/50 transition-colors hover:bg-accent/40", onClick && "cursor-pointer", className)}
    >
      {children}
    </tr>
  );
}
export function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide", className)}>{children}</th>;
}
export function TD({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}

// ---------- Sortable table helpers ----------
export type SortDir = "asc" | "desc";
export type SortValue = string | number | null | undefined;
export type Accessors<T> = Record<string, (row: T) => SortValue>;

export function useSort<T>(rows: T[], accessors: Accessors<T>, initialKey: string | null = null, initialDir: SortDir = "asc") {
  const [sortKey, setSortKey] = React.useState<string | null>(initialKey);
  const [sortDir, setSortDir] = React.useState<SortDir>(initialDir);
  const accRef = React.useRef(accessors);
  accRef.current = accessors;

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows;
    const acc = accRef.current[sortKey];
    if (!acc) return rows;
    return [...rows].sort((a, b) => {
      const va = acc(a);
      const vb = acc(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // nulls always last
      if (vb == null) return -1;
      const c =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? c : -c;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortKey, sortDir]);

  const toggle = (k: string) => {
    if (sortKey === k) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  return { sorted, sortKey, sortDir, toggle };
}

export function SortTH({
  label,
  sortId,
  sortKey,
  sortDir,
  onSort,
  className,
  align = "left",
}: {
  label: React.ReactNode;
  sortId: string;
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (k: string) => void;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const active = sortKey === sortId;
  return (
    <TH className={className}>
      <button
        onClick={() => onSort(sortId)}
        className={cn(
          "group inline-flex select-none items-center gap-1 uppercase transition-colors hover:text-foreground",
          active && "text-foreground",
          align === "right" && "flex-row-reverse"
        )}
      >
        {label}
        {active ? (
          sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-70" />
        )}
      </button>
    </TH>
  );
}
