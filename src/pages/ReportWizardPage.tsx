import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FileText, Dna, Sparkles, FlaskConical, Search, Stethoscope, MessageCircle, BookOpen, ListChecks, Presentation, Beaker } from "lucide-react";
import { seedReports, seedPatients } from "@/lib/data-service";
import { REPORT_TYPE_LIST } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/misc";
import { PageHeader } from "@/components/shared/common";
import { AiBadge } from "@/components/shared/AiPanel";
import { MarkdownLite } from "@/components/shared/MarkdownLite";
import { formatDate, cn } from "@/lib/utils";
import type { DiagnosticReport } from "@/lib/types";

const IMPLICATIONS: Record<string, string> = {
  "EGFR exon 19 deletion": "Sensitizing EGFR alteration — third-gen EGFR TKI (osimertinib) indicated.",
  "EGFR L858R": "Sensitizing EGFR alteration — EGFR TKI therapy indicated.",
  "ALK fusion": "ALK rearrangement — ALK inhibitor (alectinib/lorlatinib) indicated.",
  "ROS1 fusion": "ROS1 rearrangement — crizotinib/entrectinib indicated.",
  "KRAS G12C": "Targetable with sotorasib/adagrasib in appropriate settings.",
  "BRAF V600E": "BRAF/MEK inhibitor combination indicated.",
  "MET exon 14 skipping": "MET inhibitor (capmatinib/tepotinib) indicated.",
  "BRCA1/2": "PARP inhibitor sensitivity; germline confirmation and cascade testing advised.",
  "MSI-high": "Immune checkpoint inhibitor benefit expected (pembrolizumab).",
  "TMB-high": "Supports immunotherapy consideration.",
  "PD-L1 TPS": "Predictive for checkpoint inhibitor benefit; magnitude scales with TPS.",
  "HER2 amplification": "HER2-directed therapy (trastuzumab/T-DXd) indicated.",
  "HRD positive": "Homologous recombination deficiency — PARP inhibitor benefit likely.",
};

export function ReportWizardPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");

  const selected = seedReports.find((r) => r.id === reportId) ?? seedReports[0];

  const list = seedReports
    .filter((r) => {
      const t = q.trim().toLowerCase();
      if (t && !(r.patientName.toLowerCase().includes(t) || r.type.toLowerCase().includes(t))) return false;
      if (type && r.type !== type) return false;
      return true;
    })
    .slice(0, 60);

  return (
    <div>
      <PageHeader title="Report Wizard" subtitle="AI-assisted interpretation of genomics, pathology, IHC, liquid biopsy, germline & radiology reports">
        <AiBadge />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="flex max-h-[calc(100vh-220px)] flex-col">
          <div className="space-y-2 border-b border-border/60 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports…" className="pl-9" />
            </div>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All report types</option>
              {REPORT_TYPE_LIST.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
            {list.map((r) => (
              <button key={r.id} onClick={() => navigate(`/reports/${r.id}`)}
                className={cn("w-full rounded-lg border p-2.5 text-left transition-colors",
                  r.id === selected?.id ? "border-gold/60 bg-gold/10" : "border-border/50 hover:border-gold/30")}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.type}</span>
                  <Badge variant={r.critical ? "danger" : statusVariant(r.status)}>{r.status}</Badge>
                </div>
                <div className="truncate text-xs text-muted-foreground">{r.patientName} · {formatDate(r.reportedDate)}</div>
              </button>
            ))}
            {!list.length && <EmptyState title="No reports" />}
          </div>
        </Card>

        {selected ? <ReportDetail report={selected} /> : <EmptyState title="Select a report" />}
      </div>
    </div>
  );
}

function ReportDetail({ report }: { report: DiagnosticReport }) {
  const patient = seedPatients.find((p) => p.id === report.patientId);
  const markers = report.keyBiomarkers;
  const primary = markers[0]?.name ?? "the identified marker";

  const doctorSummary = `**${report.type}** on ${patient?.name} (${report.specimen}) resulted ${formatDate(report.reportedDate)} by ${report.lab}. ${markers.length} key marker(s) identified. Overall status: ${report.status}.${report.critical ? " ⚠ Critical actionable finding present." : ""}`;

  const patientFriendly = `Your ${report.type.toLowerCase()} looked at the biology of your ${report.tumorType.toLowerCase()}. The main finding is **${primary}**, which is like a specific signal inside the cancer cells. This helps your doctor choose a medicine that matches your cancer more precisely. We will discuss what this means for your treatment at your next visit.`;

  const nextActions = [
    report.critical ? "Escalate: review critical finding today and adjust plan." : "Review with patient at next visit.",
    markers.some((m) => IMPLICATIONS[m.name]) ? "Confirm eligibility for matched targeted therapy." : "Confirm standard-of-care regimen.",
    report.hasTrialMatch ? "Screen for matching clinical trial." : "Re-profile at progression.",
    "Document interpretation in chart and, if complex, refer to MTB.",
  ];

  const sections = [
    { icon: Stethoscope, title: "Doctor Summary", body: <MarkdownLite text={doctorSummary} /> },
    { icon: MessageCircle, title: "Patient-Friendly Summary", body: <MarkdownLite text={patientFriendly} /> },
    {
      icon: Dna,
      title: "Key Biomarkers",
      body: (
        <div className="space-y-1.5">
          {markers.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-md border border-border/50 bg-background/30 px-3 py-2 text-sm">
              <span className="font-medium">{m.name}</span>
              <span className="text-muted-foreground">{m.finding}</span>
              <Badge variant="gold">{m.tier}</Badge>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: FlaskConical,
      title: "Treatment Implications",
      body: (
        <ul className="space-y-1 text-sm">
          {markers.map((m) => (
            <li key={m.name} className="flex gap-2"><span className="text-gold">→</span> <span><b>{m.name}:</b> {IMPLICATIONS[m.name] ?? "Interpret in clinical context."}</span></li>
          ))}
        </ul>
      ),
    },
    {
      icon: BookOpen,
      title: "Guideline-Style Interpretation",
      body: <MarkdownLite text={`Per NCCN/ESMO-style guidance for **${report.tumorType}**, the identified alteration(s) place this case in a biomarker-defined subgroup. ${markers.some((m) => IMPLICATIONS[m.name]) ? "Matched targeted or immunotherapy carries category 1/2A support." : "Continue standard-of-care and reassess at progression."} Confirm with the treating team and molecular board where evidence is emerging.`} />,
    },
    { icon: ListChecks, title: "Suggested Next Actions", body: <ul className="space-y-1 text-sm">{nextActions.map((a, i) => <li key={i} className="flex gap-2"><span className="text-gold">{i + 1}.</span> {a}</li>)}</ul> },
    {
      icon: Presentation,
      title: "MTB-Ready Summary",
      body: <MarkdownLite text={`${patient?.name} (${patient?.mrn}) — ${report.tumorType}. ${report.type}: ${markers.map((m) => `${m.name} ${m.finding}`).join("; ")}. Question for board: optimal matched therapy vs standard of care; trial eligibility for actionable alteration(s).`} />,
    },
    {
      icon: Beaker,
      title: "Trial Eligibility Hints",
      body: report.hasTrialMatch
        ? <MarkdownLite text={`A basket/umbrella trial signal exists for **${primary}**. Suggested screening: confirm ECOG ≤ 1, adequate organ function, and no conflicting prior lines. Coordinate with trials office.`} />
        : <p className="text-sm text-muted-foreground">No strong trial match on file. Consider re-profiling at progression to capture emergent targets.</p>,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <div className="h-1.5 w-full bg-gradient-to-r from-gold via-coral to-transparent" />
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15 text-gold"><FileText className="h-5 w-5" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{report.type}</h2>
              <Badge variant={report.critical ? "danger" : statusVariant(report.status)}>{report.status}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{report.patientName} · {report.lab} · {report.specimen} · TAT {report.turnaroundDays}d</div>
          </div>
          {report.hasTrialMatch && <Badge variant="gold" className="ml-auto"><Sparkles className="h-3 w-3" /> Trial match</Badge>}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((s) => (
          <Card key={s.title} className="border-gold/10">
            <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><s.icon className="h-4 w-4 text-gold" /> {s.title}</CardTitle></CardHeader>
            <CardContent>{s.body}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
