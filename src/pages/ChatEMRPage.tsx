import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Search, MessageSquare } from "lucide-react";
import { seedPatients } from "@/lib/data-service";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge, riskVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { PageHeader } from "@/components/shared/common";
import { ChatEMRPanel } from "@/components/chatemr/ChatEMRPanel";
import { initials, cn } from "@/lib/utils";

export function ChatEMRPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const selected = id ?? seedPatients[0].id;

  const list = seedPatients.filter((p) => {
    const t = q.trim().toLowerCase();
    return !t || p.name.toLowerCase().includes(t) || p.cancerType.toLowerCase().includes(t);
  });

  return (
    <div>
      <PageHeader title="ChatEMR" subtitle="Ask questions about any patient's chart and get instant AI answers" />
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Card className="flex max-h-[calc(100vh-220px)] flex-col">
          <div className="border-b border-border/60 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a patient…" className="pl-9" />
            </div>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {list.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/chatemr/${p.id}`)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                  p.id === selected ? "bg-gold/12 ring-1 ring-gold/30" : "hover:bg-accent/50"
                )}
              >
                <Avatar className="h-8 w-8">{initials(p.name)}</Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.cancerType} · {p.stage}</div>
                </div>
                <Badge variant={riskVariant(p.riskLevel)} className="text-[10px]">{p.riskLevel}</Badge>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardContent className="flex flex-1 flex-col p-4">
            {selected ? (
              <ChatEMRPanel key={selected} patientId={selected} />
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <MessageSquare className="mr-2 h-5 w-5" /> Select a patient
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
