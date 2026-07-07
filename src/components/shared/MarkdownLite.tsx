import { cn } from "@/lib/utils";

// Minimal markdown renderer: **bold**, _italic_, • bullets, blank lines.
export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div className={cn("space-y-1.5 text-sm leading-relaxed", className)}>
      {lines.map((line, i) => {
        if (line.trim() === "") return <div key={i} className="h-1" />;
        const isBullet = line.trimStart().startsWith("•");
        const content = isBullet ? line.trimStart().slice(1).trim() : line;
        return (
          <p key={i} className={cn(isBullet && "flex gap-2 pl-1")}>
            {isBullet && <span className="mt-0.5 text-gold">•</span>}
            <span className={cn(isBullet && "flex-1")}>{renderInline(content)}</span>
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string) {
  const parts: (string | JSX.Element)[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      parts.push(
        <em key={key++} className="text-[11px] not-italic text-muted-foreground">
          {token.slice(1, -1)}
        </em>
      );
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
