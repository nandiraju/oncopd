import { useMemo, useState } from "react";
import { Check, ChevronRight, ChevronLeft, FlaskConical, Sparkles, Search, ClipboardCheck } from "lucide-react";
import { seedPatients, currentUser } from "@/lib/data-service";
import { ORDER_SCENARIOS, TEST_CATEGORIES } from "@/lib/constants";
import { suggestTests } from "@/lib/mock-ai";
import { useAllOrders } from "@/lib/selectors";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { PageHeader } from "@/components/shared/common";
import { AiBadge } from "@/components/shared/AiPanel";
import { initials, formatDate, cn } from "@/lib/utils";
import type { Order } from "@/lib/types";

const STEPS = ["Patient", "Scenario", "Category", "AI Tests", "Confirm"];

export function OrderWizardPage() {
  const [step, setStep] = useState(0);
  const [q, setQ] = useState("");
  const [patientId, setPatientId] = useState("");
  const [scenario, setScenario] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("Routine");
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [placed, setPlaced] = useState<Order | null>(null);

  const addOrder = useOncOPDStore((s) => s.addOrder);
  const orders = useAllOrders();
  const patient = seedPatients.find((p) => p.id === patientId);

  const suggestions = useMemo(() => (scenario ? suggestTests(scenario, patient) : []), [scenario, patient]);

  const list = seedPatients.filter((p) => {
    const t = q.trim().toLowerCase();
    return !t || p.name.toLowerCase().includes(t) || p.cancerType.toLowerCase().includes(t);
  });

  const canNext = [!!patientId, !!scenario, !!category, selectedTests.length > 0, true][step];

  const place = () => {
    const order: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      patientId,
      patientName: patient!.name,
      scenario,
      category,
      tests: selectedTests,
      status: "Pending Approval",
      priority,
      orderedBy: currentUser.name,
      orderedDate: new Date().toISOString().slice(0, 10),
      expectedTat: "10 days",
      lab: "1Cell.Ai Genomics",
      notes: "Created via Order Wizard",
    };
    addOrder(order);
    setPlaced(order);
    setStep(5);
  };

  const reset = () => {
    setStep(0); setPatientId(""); setScenario(""); setCategory(""); setSelectedTests([]); setPlaced(null); setQ("");
  };

  return (
    <div>
      <PageHeader title="Order Wizard" subtitle="Guided oncology test ordering with AI-suggested panels">
        <AiBadge />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          {/* Stepper */}
          <CardHeader className="pb-2">
            <div className="flex items-center gap-1">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-1">
                  <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    step > i ? "bg-gold text-white" : step === i ? "bg-gold/20 text-gold ring-1 ring-gold" : "bg-secondary text-muted-foreground")}>
                    {step > i ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span className={cn("hidden text-xs sm:inline", step === i ? "text-foreground" : "text-muted-foreground")}>{s}</span>
                  {i < STEPS.length - 1 && <div className={cn("h-px flex-1", step > i ? "bg-gold/50" : "bg-border")} />}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="min-h-[380px]">
            {/* Step 0: patient */}
            {step === 0 && (
              <div>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patient…" className="pl-9" />
                </div>
                <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                  {list.slice(0, 20).map((p) => (
                    <button key={p.id} onClick={() => setPatientId(p.id)}
                      className={cn("flex items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                        patientId === p.id ? "border-gold/60 bg-gold/10" : "border-border/60 hover:border-gold/30")}>
                      <Avatar className="h-8 w-8">{initials(p.name)}</Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{p.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{p.cancerType} · {p.stage}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: scenario */}
            {step === 1 && (
              <div className="grid gap-2 sm:grid-cols-2">
                {ORDER_SCENARIOS.map((s) => (
                  <button key={s.key} onClick={() => setScenario(s.key)}
                    className={cn("rounded-lg border p-3 text-left transition-colors",
                      scenario === s.key ? "border-gold/60 bg-gold/10" : "border-border/60 hover:border-gold/30")}>
                    <div className="font-medium">{s.key}</div>
                    <div className="text-xs text-muted-foreground">{s.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: category */}
            {step === 2 && (
              <div className="flex flex-wrap gap-2">
                {TEST_CATEGORIES.map((c) => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={cn("rounded-lg border px-4 py-2.5 text-sm transition-colors",
                      category === c ? "border-gold/60 bg-gold/10 text-gold" : "border-border/60 hover:border-gold/30")}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3: AI suggested tests */}
            {step === 3 && (
              <div>
                <div className="mb-3 flex items-center gap-2 rounded-lg ai-panel p-3 text-sm">
                  <Sparkles className="h-4 w-4 text-gold" />
                  <span>AI-suggested tests for <b>{scenario}</b>{patient ? ` · ${patient.cancerType}` : ""}. Toggle to include.</span>
                </div>
                <div className="space-y-2">
                  {suggestions.map((s) => {
                    const on = selectedTests.includes(s.test);
                    return (
                      <button key={s.test} onClick={() => setSelectedTests((prev) => on ? prev.filter((t) => t !== s.test) : [...prev, s.test])}
                        className={cn("flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                          on ? "border-gold/60 bg-gold/10" : "border-border/60 hover:border-gold/30")}>
                        <div className={cn("flex h-5 w-5 items-center justify-center rounded border", on ? "border-gold bg-gold text-white" : "border-border")}>
                          {on && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{s.test}</div>
                          <div className="text-xs text-muted-foreground">{s.reason}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: confirm */}
            {step === 4 && patient && (
              <div className="space-y-3">
                <SummaryRow k="Patient" v={`${patient.name} · ${patient.mrn}`} />
                <SummaryRow k="Scenario" v={scenario} />
                <SummaryRow k="Category" v={category} />
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">Selected tests</div>
                  <div className="flex flex-wrap gap-1.5">{selectedTests.map((t) => <Badge key={t} variant="gold">{t}</Badge>)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-auto">
                    {["Routine", "Urgent", "STAT"].map((p) => <option key={p}>{p}</option>)}
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: placed */}
            {step === 5 && placed && (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">Order placed — {placed.id}</h3>
                <p className="max-w-md text-sm text-muted-foreground">
                  {placed.tests.length} test(s) for {placed.patientName} submitted for approval and saved to your workspace.
                </p>
                <div className="flex gap-2">
                  <Button variant="gold" onClick={reset}>New order</Button>
                </div>
              </div>
            )}
          </CardContent>

          {step < 5 && (
            <div className="flex items-center justify-between border-t border-border/60 p-3">
              <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < 4 ? (
                <Button variant="gold" size="sm" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="gold" size="sm" onClick={place}>
                  <FlaskConical className="h-4 w-4" /> Place order
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Recent orders */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent orders</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {orders.slice(0, 8).map((o) => (
              <div key={o.id} className="rounded-lg border border-border/50 bg-background/30 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono">{o.id}</span>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </div>
                <div className="truncate text-sm">{o.patientName}</div>
                <div className="text-xs text-muted-foreground">{o.category} · {formatDate(o.orderedDate)}</div>
              </div>
            ))}
            {!orders.length && <EmptyState title="No orders yet" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
