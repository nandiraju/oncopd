import { useState } from "react";
import { Zap, GitCompare, HelpCircle, MessageCircle, Presentation, Sparkles } from "lucide-react";
import { summarize60, whatChanged, openQuestions, patientFriendly, mtbSummary } from "@/lib/mock-ai";
import { usePatientContext } from "@/lib/selectors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiOutput, AiBadge } from "@/components/shared/AiPanel";
import { Button } from "@/components/ui/button";

const ACTIONS = [
  { key: "summary", label: "Summarize patient in 60 seconds", icon: Zap, fn: summarize60 },
  { key: "changed", label: "What changed since last visit?", icon: GitCompare, fn: whatChanged },
  { key: "questions", label: "Identify open clinical questions", icon: HelpCircle, fn: openQuestions },
  { key: "friendly", label: "Generate patient-friendly explanation", icon: MessageCircle, fn: patientFriendly },
  { key: "mtb", label: "Generate MTB-ready case summary", icon: Presentation, fn: mtbSummary },
] as const;

export function AiChartReview({ patientId }: { patientId: string }) {
  const ctx = usePatientContext(patientId);
  const [active, setActive] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!ctx) return null;

  const run = (key: string, fn: (c: typeof ctx) => string) => {
    setActive(key);
    setLoading(true);
    setOutput("");
    setTimeout(() => {
      setOutput(fn(ctx));
      setLoading(false);
    }, 500);
  };

  return (
    <Card className="border-gold/20">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-gold" /> AI Chart Review
        </CardTitle>
        <AiBadge />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIONS.map((a) => (
            <Button
              key={a.key}
              variant={active === a.key ? "gold" : "outline"}
              size="sm"
              onClick={() => run(a.key, a.fn as (c: typeof ctx) => string)}
              className={`justify-start ${active !== a.key ? "border-gold/25 hover:border-gold/50" : ""}`}
            >
              <a.icon className="h-4 w-4" />
              <span className="truncate">{a.label}</span>
            </Button>
          ))}
        </div>
        {(loading || output) && <AiOutput text={output} loading={loading} />}
        {!loading && !output && (
          <p className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
            Select an action to generate an AI summary from this patient's chart.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
