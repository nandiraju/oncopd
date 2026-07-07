import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Brain, Sparkles, FileDown, Users, Dna, ListChecks, FlaskConical, BookOpen, Presentation, ClipboardList } from "lucide-react";
import { seedMtb, seedPatients } from "@/lib/data-service";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { PageHeader } from "@/components/shared/common";
import { AiOutput } from "@/components/shared/AiPanel";
import { formatDate, cn } from "@/lib/utils";
import { SYNTHETIC_TAG } from "@/lib/mock-ai";
import type { MTBCase } from "@/lib/types";

export function MTBPage() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const selected = seedMtb.find((m) => m.id === caseId) ?? seedMtb[0];

  return (
    <div>
      <PageHeader title="Personalized Molecular Tumor Board" subtitle="AI-assisted MTB case preparation and presentation-ready briefs" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex max-h-[calc(100vh-220px)] flex-col">
          <CardHeader className="pb-2"><CardTitle className="text-sm">MTB cases · {seedMtb.length}</CardTitle></CardHeader>
          <CardContent className="flex-1 space-y-1.5 overflow-y-auto">
            {seedMtb.map((m) => (
              <button key={m.id} onClick={() => navigate(`/mtb/${m.id}`)}
                className={cn("w-full rounded-lg border p-2.5 text-left transition-colors",
                  m.id === selected?.id ? "border-gold/60 bg-gold/10" : "border-border/50 hover:border-gold/30")}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{m.patientName}</span>
                  <Badge variant={statusVariant(m.status)} className="text-[9px]">{m.status}</Badge>
                </div>
                <div className="truncate text-xs text-muted-foreground">{m.cancerType} · Stage {m.stage}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {selected ? <MTBDetail mtb={selected} /> : <EmptyState title="No MTB case selected" />}
      </div>
    </div>
  );
}

function MTBDetail({ mtb }: { mtb: MTBCase }) {
  const patient = seedPatients.find((p) => p.id === mtb.patientId);
  const briefs = useOncOPDStore((s) => s.mtbBriefs);
  const saveBrief = useOncOPDStore((s) => s.saveMtbBrief);
  const [brief, setBrief] = useState(briefs[mtb.id]?.text ?? "");
  const [loading, setLoading] = useState(false);

  const generate = () => {
    setLoading(true);
    setBrief("");
    setTimeout(() => {
      const text = buildBrief(mtb, patient?.mrn ?? "");
      setBrief(text);
      saveBrief(mtb.id, text);
      setLoading(false);
    }, 700);
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="h-1.5 w-full bg-gradient-to-r from-gold via-coral to-transparent" />
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/15 text-gold"><Brain className="h-5 w-5" /></div>
          <div>
            <div className="flex items-center gap-2">
              <Link to={`/patients/${mtb.patientId}`} className="text-lg font-bold hover:text-gold">{mtb.patientName}</Link>
              <Badge variant={statusVariant(mtb.status)}>{mtb.status}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{mtb.cancerType} · Stage {mtb.stage} · MTB {formatDate(mtb.scheduledDate)}</div>
          </div>
          <Button variant="gold" size="sm" className="ml-auto" onClick={generate}><Sparkles className="h-4 w-4" /> Generate MTB Brief</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Section icon={ClipboardList} title="Case Summary">
          <p className="text-sm">{patient?.age}y {patient?.gender}, {mtb.cancerType}, Stage {mtb.stage}. Diagnosed {formatDate(patient?.diagnosisDate ?? "")}. ECOG {patient?.ecog}. Risk {patient?.riskLevel}.</p>
        </Section>
        <Section icon={Users} title="Panel">
          <div className="flex flex-wrap gap-1.5">{mtb.panel.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}</div>
        </Section>
        <Section icon={FlaskConical} title="Prior Treatments">
          <ul className="space-y-1 text-sm">{mtb.priorTreatments.map((t) => <li key={t} className="flex gap-2"><span className="text-gold">•</span> {t}</li>)}</ul>
        </Section>
        <Section icon={Dna} title="Molecular Findings">
          <div className="space-y-1.5">
            {mtb.molecularFindings.map((m) => (
              <div key={m.marker} className="flex items-center justify-between rounded-md border border-border/50 bg-background/30 px-3 py-1.5 text-sm">
                <span className="font-medium">{m.marker}</span>
                <span className="text-xs text-muted-foreground">{m.result}</span>
                <Badge variant="gold" className="text-[9px]">{m.actionability}</Badge>
              </div>
            ))}
          </div>
        </Section>
        <Section icon={ListChecks} title="Key Clinical Questions">
          <ul className="space-y-1 text-sm">{mtb.clinicalQuestions.map((q, i) => <li key={i} className="flex gap-2"><span className="text-gold">{i + 1}.</span> {q}</li>)}</ul>
        </Section>
        <Section icon={FlaskConical} title="Treatment Options">
          <div className="space-y-2">
            {mtb.treatmentOptions.map((t) => (
              <div key={t.therapy} className="rounded-md border border-border/50 bg-background/30 p-2.5">
                <div className="flex items-center justify-between"><span className="text-sm font-medium">{t.therapy}</span><Badge variant="info" className="text-[9px]">{t.evidenceLevel}</Badge></div>
                <div className="text-xs text-muted-foreground">{t.rationale}</div>
              </div>
            ))}
          </div>
        </Section>
        <Section icon={BookOpen} title="Evidence Summary" className="md:col-span-2">
          <p className="text-sm">{mtb.evidenceSummary}</p>
        </Section>
        <Section icon={Presentation} title="Final Recommendation" className="md:col-span-2">
          <p className="text-sm">{mtb.recommendation ?? "Awaiting board consensus — generate a brief to draft a recommendation."}</p>
        </Section>
      </div>

      {(loading || brief) && (
        <Card className="border-gold/30">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><Presentation className="h-4 w-4 text-gold" /> MTB Brief — presentation-ready</CardTitle>
            {brief && <Button variant="outline" size="sm" onClick={() => downloadBrief(mtb, brief)}><FileDown className="h-4 w-4" /> Export</Button>}
          </CardHeader>
          <CardContent><AiOutput text={brief} loading={loading} /></CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ icon: Icon, title, children, className }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-gold" /> {title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function buildBrief(mtb: MTBCase, mrn: string): string {
  const p = seedPatients.find((x) => x.id === mtb.patientId);
  return [
    `**MOLECULAR TUMOR BOARD — CASE BRIEF**`,
    `**Patient:** ${mtb.patientName} (${mrn}) · ${p?.age}y ${p?.gender}`,
    `**Diagnosis:** ${mtb.cancerType}, Stage ${mtb.stage} · ECOG ${p?.ecog}`,
    `**Date:** ${formatDate(mtb.scheduledDate)} · **Panel:** ${mtb.panel.length} members`,
    "",
    `**1. Clinical Course**`,
    `Prior/current therapy: ${mtb.priorTreatments.join(", ")}.`,
    "",
    `**2. Molecular Findings**`,
    ...mtb.molecularFindings.map((m) => `• ${m.marker}: ${m.result} — ${m.actionability}`),
    "",
    `**3. Questions for the Board**`,
    ...mtb.clinicalQuestions.map((q, i) => `${i + 1}. ${q}`),
    "",
    `**4. Treatment Options Considered**`,
    ...mtb.treatmentOptions.map((t) => `• ${t.therapy} (${t.evidenceLevel}) — ${t.rationale}`),
    "",
    `**5. Evidence Summary**`,
    mtb.evidenceSummary,
    "",
    `**6. Recommendation**`,
    mtb.recommendation ?? "Board to finalize: prioritize biomarker-matched therapy with parallel trial screening; define resistance-surveillance plan.",
    "",
    `_${SYNTHETIC_TAG}_`,
  ].join("\n");
}

function downloadBrief(mtb: MTBCase, text: string) {
  const blob = new Blob([text.replace(/\*\*/g, "").replace(/_/g, "")], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MTB_Brief_${mtb.patientName.replace(/\s/g, "_")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
