import { useState } from "react";
import { Link } from "react-router-dom";
import { Users2, Plus, Sparkles, Search, FileText, Send } from "lucide-react";
import { seedPatients, oncologists, currentUser, seedReports } from "@/lib/data-service";
import { SPECIALTIES } from "@/lib/constants";
import { useAllPeerReviews } from "@/lib/selectors";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { PageHeader, FilterChip } from "@/components/shared/common";
import { formatDate, initials } from "@/lib/utils";
import { SYNTHETIC_TAG } from "@/lib/mock-ai";
import type { PeerReview } from "@/lib/types";

export function PeerReviewPage() {
  const reviews = useAllPeerReviews();
  const addPeerReview = useOncOPDStore((s) => s.addPeerReview);
  const [filter, setFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<PeerReview | null>(null);

  const shown = reviews.filter((r) => !filter || r.status === filter);
  const statuses = ["Requested", "In Review", "Awaiting Reports", "Recommendation Ready", "Completed"];

  return (
    <div>
      <PageHeader title="Peer Review / Second Opinion" subtitle="Request and track second opinions across specialties">
        <Button variant="gold" size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New request</Button>
      </PageHeader>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip label="All" active={filter === null} onClick={() => setFilter(null)} />
        {statuses.map((s) => (
          <FilterChip key={s} label={s} count={reviews.filter((r) => r.status === s).length} active={filter === s} onClick={() => setFilter(filter === s ? null : s)} />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((r) => (
          <Card key={r.id} className="flex cursor-pointer flex-col transition-colors hover:border-gold/40" onClick={() => setDetail(r)}>
            <CardContent className="flex flex-1 flex-col p-4">
              <div className="flex items-center justify-between">
                <Badge variant={r.type === "Second Opinion" ? "gold" : "info"}>{r.type}</Badge>
                <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              </div>
              <div className="mt-2 font-medium">{r.patientName}</div>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{r.question}</p>
              <div className="mt-3 flex items-center gap-2 border-t border-border/40 pt-2 text-xs text-muted-foreground">
                <Avatar className="h-6 w-6 text-[9px]">{initials(r.reviewer)}</Avatar>
                <span className="truncate">{r.reviewer} · {r.specialty}</span>
                <span className="ml-auto">{formatDate(r.requestedDate)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {!shown.length && <EmptyState title="No requests" />}
      </div>

      <NewRequestDialog open={open} onClose={() => setOpen(false)} onCreate={addPeerReview} />

      {/* Detail */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} className="max-w-2xl" title={detail ? `${detail.type} — ${detail.patientName}` : ""}>
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge>
              <Badge variant={detail.priority === "Urgent" ? "danger" : "muted"}>{detail.priority}</Badge>
              <Link to={`/patients/${detail.patientId}`} className="ml-auto text-gold hover:underline">Open patient →</Link>
            </div>
            <Field k="Reviewer" v={`${detail.reviewer} · ${detail.specialty}`} />
            <Field k="Requested by" v={detail.requestedBy} />
            <Field k="Clinical question" v={detail.question} />
            <div className="rounded-lg ai-panel p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gold"><Sparkles className="h-3.5 w-3.5" /> AI-generated case brief</div>
              <p>{caseBrief(detail)}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">{SYNTHETIC_TAG}</p>
            </div>
            <div>
              <div className="mb-1 text-xs text-muted-foreground">Attached reports</div>
              <div className="flex flex-wrap gap-1.5">
                {detail.attachedReports.length ? detail.attachedReports.map((id) => (
                  <Link key={id} to={`/reports/${id}`}><Badge variant="secondary"><FileText className="h-3 w-3" /> {id}</Badge></Link>
                )) : <span className="text-xs text-muted-foreground">None attached</span>}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/30 p-3">
              <div className="text-xs text-muted-foreground">Final recommendation</div>
              <p className="mt-0.5">{detail.recommendation ?? "Pending reviewer input."}</p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return <div><span className="text-xs text-muted-foreground">{k}</span><p>{v}</p></div>;
}

function caseBrief(r: PeerReview) {
  const p = seedPatients.find((x) => x.id === r.patientId);
  if (!p) return "Case details unavailable.";
  return `${p.age}y ${p.gender} with ${p.cancerType}, Stage ${p.stage} (ECOG ${p.ecog}), diagnosed ${formatDate(p.diagnosisDate)}. Current therapy: ${p.currentTreatment}. Molecular: ${p.biomarkers.map((b) => b.name).join(", ") || "pending"}. Referred for ${r.specialty} opinion on: ${r.question}`;
}

function NewRequestDialog({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (r: PeerReview) => void }) {
  const [q, setQ] = useState("");
  const [patientId, setPatientId] = useState("");
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [question, setQuestion] = useState("");
  const [priority, setPriority] = useState("Routine");

  const patient = seedPatients.find((p) => p.id === patientId);
  const reviewer = oncologists.find((o) => o.subspecialty === specialty && o.id !== currentUser.id) ?? oncologists[1];
  const list = seedPatients.filter((p) => { const t = q.trim().toLowerCase(); return !t || p.name.toLowerCase().includes(t); }).slice(0, 6);

  const submit = () => {
    if (!patient) return;
    const attached = seedReports.filter((r) => r.patientId === patientId).slice(0, 1).map((r) => r.id);
    onCreate({
      id: `PR-${Date.now().toString().slice(-6)}`,
      patientId,
      patientName: patient.name,
      type: "Second Opinion",
      requestedById: currentUser.id,
      requestedBy: currentUser.name,
      reviewerId: reviewer.id,
      reviewer: reviewer.name,
      specialty,
      question: question || "Requesting a second opinion on management.",
      status: "Requested",
      requestedDate: new Date().toISOString().slice(0, 10),
      attachedReports: attached,
      recommendation: null,
      priority,
    });
    onClose();
    setPatientId(""); setQuestion(""); setQ("");
  };

  return (
    <Dialog open={open} onClose={onClose} title="New second opinion request" description="Select a patient, specialty and question. An AI case brief is auto-attached.">
      <div className="space-y-3">
        <div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient…" className="pl-9" />
          </div>
          <div className="grid max-h-40 gap-1.5 overflow-y-auto sm:grid-cols-2">
            {list.map((p) => (
              <button key={p.id} onClick={() => setPatientId(p.id)}
                className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm ${patientId === p.id ? "border-gold/60 bg-gold/10" : "border-border/60"}`}>
                <Avatar className="h-6 w-6 text-[9px]">{initials(p.name)}</Avatar>
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Specialty</label>
            <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>{SPECIALTIES.map((s) => <option key={s}>{s}</option>)}</Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Priority</label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>{["Routine", "Urgent"].map((p) => <option key={p}>{p}</option>)}</Select>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Clinical question</label>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Confirm first-line regimen given molecular profile" rows={3} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="gold" size="sm" disabled={!patientId} onClick={submit}><Send className="h-4 w-4" /> Create request</Button>
        </div>
      </div>
    </Dialog>
  );
}
