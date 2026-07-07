import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { seedPatients } from "@/lib/data-service";
import { Badge, riskVariant } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

export function CommandSearch({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return seedPatients.slice(0, 8);
    return seedPatients
      .filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.mrn.toLowerCase().includes(term) ||
          p.cancerType.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [q]);

  return (
    <Dialog open={open} onClose={onClose} className="max-w-xl p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, MRN, or cancer type…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {results.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              onPick(p.id);
              onClose();
              setQ("");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground">
                {p.mrn} · {p.cancerType} · Stage {p.stage}
              </div>
            </div>
            <Badge variant={riskVariant(p.riskLevel)}>{p.riskLevel}</Badge>
          </button>
        ))}
        {!results.length && <p className="px-3 py-6 text-center text-sm text-muted-foreground">No patients found.</p>}
      </div>
    </Dialog>
  );
}
