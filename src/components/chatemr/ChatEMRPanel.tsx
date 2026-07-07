import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Trash2, MessageSquare } from "lucide-react";
import { chatEMRRespond } from "@/lib/mock-ai";
import { usePatientContext } from "@/lib/selectors";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { MarkdownLite } from "@/components/shared/MarkdownLite";
import { initials } from "@/lib/utils";
import { currentUser } from "@/lib/data-service";
import type { ChatMessage } from "@/lib/types";

const SUGGESTIONS = [
  "What is this patient's diagnosis and stage?",
  "What mutations were found?",
  "What treatments has the patient received?",
  "What changed since last visit?",
  "Summarize the latest report.",
  "Prepare this case for MTB.",
  "Explain this report to the patient in simple language.",
];

let counter = 0;
const genId = () => `chat-${Date.now()}-${counter++}`;

const EMPTY_HISTORY: ChatMessage[] = [];

export function ChatEMRPanel({ patientId, compact }: { patientId: string; compact?: boolean }) {
  const ctx = usePatientContext(patientId);
  // Select a stable reference; default outside the selector so we never return a fresh array.
  const history = useOncOPDStore((s) => s.chatHistory[patientId]) ?? EMPTY_HISTORY;
  const pushChat = useOncOPDStore((s) => s.pushChat);
  const clearChat = useOncOPDStore((s) => s.clearChat);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [history, thinking]);

  if (!ctx) return null;

  const ask = (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: genId(), patientId, role: "doctor", text, timestamp: new Date().toISOString() };
    pushChat(patientId, userMsg);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      const reply = chatEMRRespond(text, ctx);
      pushChat(patientId, { id: genId(), patientId, role: "assistant", text: reply, timestamp: new Date().toISOString() });
      setThinking(false);
    }, 550);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-gold" /> ChatEMR — {ctx.patient.firstName}
        </div>
        {history.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => clearChat(patientId)}>
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div ref={scrollRef} className={`flex-1 space-y-3 overflow-y-auto py-3 ${compact ? "max-h-[420px]" : "min-h-[300px]"}`}>
        {history.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <MessageSquare className="h-8 w-8 text-gold/50" />
            <p className="text-sm">Ask anything about {ctx.patient.firstName}'s chart.</p>
            <p className="text-xs">Answers are grounded in this patient's chart.</p>
          </div>
        )}
        {history.map((m) =>
          m.role === "doctor" ? (
            <div key={m.id} className="flex justify-end gap-2">
              <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-gold/15 px-3 py-2 text-sm text-foreground">{m.text}</div>
              <Avatar className="h-7 w-7">{initials(currentUser.name)}</Avatar>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-indigo-600 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="max-w-[85%] rounded-lg rounded-tl-sm border border-gold/20 bg-card/80 px-3 py-2">
                <MarkdownLite text={m.text} />
              </div>
            </div>
          )
        )}
        {thinking && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-indigo-600 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-lg border border-gold/20 bg-card/80 px-3 py-2 text-sm text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gold" />
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border/60 pt-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.slice(0, compact ? 4 : 7).map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-sm border border-gold/25 bg-card/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-gold/50 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex gap-2"
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this patient…" />
          <Button type="submit" variant="gold" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
