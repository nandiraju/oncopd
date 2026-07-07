import { useState } from "react";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownLite } from "./MarkdownLite";

export function AiBadge() {
  return (
    <Badge variant="gold" className="gap-1">
      <Sparkles className="h-3 w-3" /> AI Assist
    </Badge>
  );
}

export function AiOutput({ text, loading }: { text: string; loading?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg ai-panel p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-gold" />
        Generating…
      </div>
    );
  }
  if (!text) return null;
  return (
    <div className="relative rounded-lg ai-panel p-4">
      <button
        onClick={() => {
          navigator.clipboard?.writeText(text.replace(/\*\*/g, "").replace(/_/g, ""));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Copy"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <MarkdownLite text={text} className="pr-6" />
    </div>
  );
}

export function AiActionButton({
  label,
  onClick,
  active,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Button
      variant={active ? "gold" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("justify-start", !active && "border-gold/25 hover:border-gold/50")}
    >
      {Icon ? <Icon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </Button>
  );
}
