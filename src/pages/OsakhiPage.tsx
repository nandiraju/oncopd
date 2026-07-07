import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Sparkles, Send, UserCog, CalendarPlus, StickyNote, AlertCircle } from "lucide-react";
import { seedPatients, currentUser } from "@/lib/data-service";
import { useMessages } from "@/lib/selectors";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar, EmptyState, Separator } from "@/components/ui/misc";
import { PageHeader, FilterChip } from "@/components/shared/common";
import { formatDateTime, initials, cn } from "@/lib/utils";
import { SYNTHETIC_TAG } from "@/lib/mock-ai";

const REPLIES: Record<string, string> = {
  "Side Effect": "Thank you for letting us know. What you describe can happen after treatment. Please take your prescribed supportive medicines, stay hydrated, and monitor your symptoms. If it worsens or you develop fever, contact us immediately. We'll review this at your next visit.",
  "Report Query": "Your report is being reviewed by your oncology team. We'll walk you through the findings in simple terms at your upcoming appointment. There's nothing you need to do right now — please don't worry.",
  Medication: "Please continue your other medicines as prescribed. For the specific query, do not double a missed dose. Our nurse will call you today to arrange a refill and clarify timing.",
  Appointment: "Noted. We'll confirm the updated slot shortly through OSakhi. Please arrive 15 minutes early with your reports.",
  Symptom: "Thank you for reporting this. Given your symptoms, we'd like to assess you sooner. Our team will reach out to arrange an early review. If you feel worse, please go to the nearest emergency facility.",
  Distress: "We hear you, and it's completely understandable to feel this way. You are not alone — your care team is here for you. We'll arrange a supportive call and can connect you with counselling. Please reach out anytime.",
  General: "Thank you for your message. We've noted it and your care team will follow up as needed.",
};

const CATS = ["Side Effect", "Report Query", "Medication", "Appointment", "Symptom", "Distress", "General"];

export function OsakhiPage() {
  const messages = useMessages();
  const [cat, setCat] = useState<string | null>(null);
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [toast, setToast] = useState("");

  const setOverlay = useOncOPDStore((s) => s.setMsgOverlay);
  const addNote = useOncOPDStore((s) => s.addChartNote);

  const filtered = useMemo(
    () => messages.filter((m) => (!cat || m.category === cat) && (!onlyUrgent || m.urgent)),
    [messages, cat, onlyUrgent]
  );
  const selected = messages.find((m) => m.id === selectedId) ?? filtered[0];
  const patient = selected ? seedPatients.find((p) => p.id === selected.patientId) : undefined;

  const notify = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };

  const suggest = () => {
    if (!selected) return;
    setDraft(REPLIES[selected.category] ?? REPLIES.General);
    setShowAi(true);
  };

  const send = () => {
    if (!selected || !draft.trim()) return;
    setOverlay(selected.id, { status: "Replied", reply: draft, repliedAt: new Date().toISOString() });
    notify(`Reply sent to ${selected.patientName}`);
    setDraft("");
    setShowAi(false);
  };

  return (
    <div>
      <PageHeader title="OSakhi Inbox" subtitle="Patient communication with AI-suggested replies">
        <Badge variant="gold" className="gap-1"><Inbox className="h-3.5 w-3.5" /> {messages.filter((m) => m.status === "Unread").length} unread</Badge>
      </PageHeader>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <FilterChip label="All" active={cat === null && !onlyUrgent} onClick={() => { setCat(null); setOnlyUrgent(false); }} />
        <FilterChip label="Urgent" active={onlyUrgent} count={messages.filter((m) => m.urgent).length} onClick={() => setOnlyUrgent((v) => !v)} />
        {CATS.map((c) => (
          <FilterChip key={c} label={c} active={cat === c} count={messages.filter((m) => m.category === c).length} onClick={() => setCat(cat === c ? null : c)} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        {/* list */}
        <Card className="flex max-h-[calc(100vh-260px)] flex-col">
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {filtered.map((m) => (
              <button key={m.id} onClick={() => { setSelectedId(m.id); setDraft(m.reply ?? ""); setShowAi(false); }}
                className={cn("w-full rounded-lg border p-2.5 text-left transition-colors",
                  m.id === selected?.id ? "border-gold/60 bg-gold/10" : "border-border/50 hover:border-gold/30")}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7 text-[10px]">{initials(m.patientName)}</Avatar>
                  <span className="flex-1 truncate text-sm font-medium">{m.patientName}</span>
                  {m.urgent && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                  <Badge variant={statusVariant(m.status)} className="text-[9px]">{m.status}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{m.text}</p>
                <div className="mt-1 flex items-center justify-between">
                  <Badge variant={m.urgent ? "danger" : "muted"} className="text-[9px]">{m.category}</Badge>
                  <span className="text-[10px] text-muted-foreground">{formatDateTime(m.datetime)}</span>
                </div>
              </button>
            ))}
            {!filtered.length && <EmptyState title="No messages" />}
          </div>
        </Card>

        {/* detail */}
        {selected ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">{initials(selected.patientName)}</Avatar>
                <div className="flex-1">
                  <Link to={`/patients/${selected.patientId}`} className="font-medium hover:text-gold">{selected.patientName}</Link>
                  <div className="text-xs text-muted-foreground">{patient?.cancerType} · {patient?.stage} · {formatDateTime(selected.datetime)}</div>
                </div>
                <Badge variant={selected.urgent ? "danger" : "muted"}>{selected.category}</Badge>
                <Badge variant={selected.sentiment === "Negative" ? "danger" : selected.sentiment === "Positive" ? "success" : "muted"}>{selected.sentiment}</Badge>
              </div>

              <div className="mt-3 rounded-lg rounded-tl-sm border border-border/60 bg-background/40 p-3 text-sm">{selected.text}</div>

              {selected.reply && (
                <div className="mt-2 ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-gold/12 p-3 text-sm">
                  <div className="mb-1 text-[10px] uppercase tracking-wide text-gold">Sent reply</div>
                  {selected.reply}
                </div>
              )}

              <Separator className="my-4" />

              {showAi && (
                <div className="mb-2 rounded-lg ai-panel p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gold"><Sparkles className="h-3.5 w-3.5" /> AI-suggested reply</div>
                  <p className="text-[11px] text-muted-foreground">{SYNTHETIC_TAG}</p>
                </div>
              )}

              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write or generate a reply…" rows={4} />

              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="border-gold/30" onClick={suggest}><Sparkles className="h-4 w-4" /> AI-suggested reply</Button>
                <Button variant="gold" size="sm" disabled={!draft.trim()} onClick={send}><Send className="h-4 w-4" /> Send</Button>
                <Button variant="outline" size="sm" onClick={() => { setOverlay(selected.id, { status: "Escalated" }); notify(`Escalated to nurse: ${selected.patientName}`); }}>
                  <UserCog className="h-4 w-4" /> Escalate to nurse
                </Button>
                <Button variant="outline" size="sm" onClick={() => notify(`Appointment request created for ${selected.patientName}`)}>
                  <CalendarPlus className="h-4 w-4" /> Convert to appointment
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  addNote({ id: `note-${Date.now()}`, patientId: selected.patientId, text: `[OSakhi · ${selected.category}] ${selected.text}`, author: currentUser.name, timestamp: new Date().toISOString(), source: "OSakhi" });
                  notify("Added to chart note");
                }}>
                  <StickyNote className="h-4 w-4" /> Add to chart note
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="Select a message" />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-gold/40 bg-popover px-4 py-2 text-sm shadow-lg animate-fade-in">
          <span className="text-gold">✓</span> {toast}
        </div>
      )}
    </div>
  );
}
