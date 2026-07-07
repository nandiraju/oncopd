import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { seedPatients } from "@/lib/data-service";
import { CANCER_LIST } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, riskVariant } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Table, THead, TR, TH, TD, EmptyState, SortTH, useSort } from "@/components/ui/misc";
import { PatientCell, PageHeader, RiskBadge } from "@/components/shared/common";
import { formatDate, RISK_RANK } from "@/lib/utils";
import type { Patient } from "@/lib/types";

export function PatientRegistryPage() {
  const [q, setQ] = useState("");
  const [cancer, setCancer] = useState("");
  const [risk, setRisk] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return seedPatients.filter((p) => {
      if (term && !(p.name.toLowerCase().includes(term) || p.mrn.toLowerCase().includes(term) || p.treatingOncologist.toLowerCase().includes(term))) return false;
      if (cancer && p.cancerType !== cancer) return false;
      if (risk && p.riskLevel !== risk) return false;
      return true;
    });
  }, [q, cancer, risk]);

  const accessors: Record<string, (p: Patient) => string | number> = {
    patient: (p) => p.name,
    cancer: (p) => `${p.cancerType} ${p.stage}`,
    biomarkers: (p) => p.biomarkers.length,
    risk: (p) => RISK_RANK[p.riskLevel],
    oncologist: (p) => p.treatingOncologist,
    treatment: (p) => p.currentTreatment,
    lastVisit: (p) => p.lastVisit,
    carePlan: (p) => p.carePlanStatus,
  };
  const { sorted, sortKey, sortDir, toggle } = useSort(filtered, accessors, "patient");

  const thProps = (sortId: string) => ({ sortId, sortKey, sortDir, onSort: toggle });

  return (
    <div>
      <PageHeader title="Patient Registry" subtitle={`${seedPatients.length} oncology patients across the network`} />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, MRN, oncologist…" className="pl-9" />
            </div>
            <Select value={cancer} onChange={(e) => setCancer(e.target.value)} className="w-auto">
              <option value="">All cancer types</option>
              {CANCER_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Select value={risk} onChange={(e) => setRisk(e.target.value)} className="w-auto">
              <option value="">All risk levels</option>
              {["Critical", "High", "Moderate", "Low"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
            <Badge variant="outline" className="gap-1.5">
              <SlidersHorizontal className="h-3 w-3" /> {filtered.length}
            </Badge>
          </div>

          <div className="max-h-[calc(100vh-320px)] overflow-y-auto rounded-lg border border-border/60">
            <Table>
              <THead>
                <TR>
                  <SortTH label="Patient" {...thProps("patient")} />
                  <SortTH label="Cancer / Stage" {...thProps("cancer")} />
                  <SortTH label="Biomarkers" {...thProps("biomarkers")} />
                  <SortTH label="Risk" {...thProps("risk")} />
                  <SortTH label="Treating Oncologist" {...thProps("oncologist")} />
                  <SortTH label="Current Treatment" {...thProps("treatment")} />
                  <SortTH label="Last Visit" {...thProps("lastVisit")} />
                  <SortTH label="Care Plan" {...thProps("carePlan")} />
                </TR>
              </THead>
              <tbody>
                {sorted.map((p) => (
                  <TR key={p.id}>
                    <TD><PatientCell patient={p} subtitle={`${p.mrn} · ${p.age}y ${p.gender}`} /></TD>
                    <TD>
                      <div className="text-sm">{p.cancerType}</div>
                      <div className="text-xs text-muted-foreground">Stage {p.stage} · ECOG {p.ecog}</div>
                    </TD>
                    <TD>
                      <div className="flex max-w-[180px] flex-wrap gap-1">
                        {p.biomarkers.slice(0, 2).map((b) => (
                          <Badge key={b.name} variant={b.actionable ? "gold" : "muted"} className="text-[10px]">{b.name}</Badge>
                        ))}
                        {p.biomarkers.length > 2 && <Badge variant="muted" className="text-[10px]">+{p.biomarkers.length - 2}</Badge>}
                      </div>
                    </TD>
                    <TD><RiskBadge risk={p.riskLevel} /></TD>
                    <TD><span className="text-sm">{p.treatingOncologist}</span></TD>
                    <TD><span className="text-xs text-muted-foreground">{p.currentTreatment}</span></TD>
                    <TD><span className="text-xs">{formatDate(p.lastVisit)}</span></TD>
                    <TD><Badge variant={riskVariant(p.riskLevel) === "danger" ? "danger" : "secondary"} className="font-normal">{p.carePlanStatus}</Badge></TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            {!filtered.length && <EmptyState title="No patients match your filters" hint="Try clearing search or filters" />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
