import { useEffect, useMemo, useState } from "react";
import { useFlow } from "@/lib/flow-store";
import { Search } from "lucide-react";

export function CommandPalette({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
}) {
  const flow = useFlow((s) => s.flow);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const all = Object.values(flow.questions);
    const term = q.trim().toLowerCase();
    const filtered = term
      ? all.filter(
          (x) =>
            String(x.id).includes(term) ||
            x.title.toLowerCase().includes(term) ||
            x.answers.some((a) => a.text.toLowerCase().includes(term))
        )
      : all;
    return filtered.slice(0, 30);
  }, [flow, q]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/30 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-border bg-popover shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ir para pergunta — ID, título ou resposta"
            className="flex-1 bg-transparent text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && results[0]) {
                onSelect(results[0].id);
                onClose();
              }
            }}
          />
          <kbd className="border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
        </div>
        <ul className="max-h-80 overflow-auto">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => {
                  onSelect(r.id);
                  onClose();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                <span className="font-mono text-xs text-primary">#{r.id}</span>
                <span className="flex-1 truncate">{r.title}</span>
                <span className="text-[11px] text-muted-foreground">{r.answers.length} resp.</span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="p-3 text-xs text-muted-foreground">Sem resultados.</li>
          )}
        </ul>
      </div>
    </div>
  );
}