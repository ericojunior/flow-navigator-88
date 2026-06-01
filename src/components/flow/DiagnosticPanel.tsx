import { useFlow, diagnose } from "@/lib/flow-store";
import { useMemo } from "react";

export function DiagnosticPanel({ onSelect }: { onSelect: (id: number) => void }) {
  const flow = useFlow((s) => s.flow);
  const diag = useMemo(() => diagnose(flow), [flow]);

  const sections: { label: string; ids: number[]; tone?: "warning" | "error" | "neutral" }[] = [
    { label: "Perguntas sem entrada (órfãs)", ids: diag.orphans, tone: "error" },
    { label: "Perguntas não alcançáveis a partir da inicial", ids: diag.unreachable, tone: "error" },
    { label: "Perguntas sem resposta", ids: diag.noAnswers, tone: "error" },
    { label: "Loops detectados", ids: diag.loops, tone: "warning" },
    { label: "Caminhos muito longos (> 20)", ids: diag.longPaths, tone: "warning" },
    { label: "Finais de fluxo", ids: diag.finals, tone: "neutral" },
    { label: "Perguntas duplicadas (por título)", ids: diag.duplicates.flat(), tone: "warning" },
  ];

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-semibold text-foreground">Diagnóstico do fluxo</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {diag.danglingAnswers.length} resposta(s) sem destino válido
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {sections.map((s) => (
          <section key={s.label} className="border border-border bg-background">
            <header className="flex items-center justify-between border-b border-border bg-secondary px-3 py-2">
              <span className="text-xs font-medium text-foreground">{s.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{s.ids.length}</span>
            </header>
            {s.ids.length > 0 ? (
              <ul className="max-h-40 divide-y divide-border overflow-auto">
                {s.ids.slice(0, 50).map((id, i) => (
                  <li key={`${id}-${i}`}>
                    <button
                      onClick={() => onSelect(id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-secondary"
                    >
                      <span className="font-mono text-primary">#{id}</span>
                      <span className="flex-1 truncate text-foreground">
                        {flow.questions[id]?.title ?? "—"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum item.</div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}