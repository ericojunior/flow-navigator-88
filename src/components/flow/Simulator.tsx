import { useState } from "react";
import { useFlow } from "@/lib/flow-store";
import { MarkerDot } from "./StatusBadge";
import { X, RotateCcw, Undo2 } from "lucide-react";

export function Simulator({ onClose }: { onClose: () => void }) {
  const flow = useFlow((s) => s.flow);
  const [path, setPath] = useState<number[]>([flow.rootId]);
  const [ended, setEnded] = useState(false);
  const current = path[path.length - 1];
  const q = flow.questions[current];

  const reset = () => {
    setPath([flow.rootId]);
    setEnded(false);
  };
  const back = () => {
    if (ended) {
      setEnded(false);
      return;
    }
    if (path.length > 1) setPath(path.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-foreground/30 p-4">
      <div className="flex h-full max-h-[700px] w-full max-w-2xl flex-col border border-border bg-card shadow-lg">
        <header className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Simulação de atendimento</div>
            <div className="text-xs text-muted-foreground">Versão {flow.version}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={back} className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-xs hover:bg-secondary">
              <Undo2 className="h-3 w-3" /> Voltar etapa
            </button>
            <button onClick={reset} className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-xs hover:bg-secondary">
              <RotateCcw className="h-3 w-3" /> Reiniciar
            </button>
            <button onClick={onClose} className="p-1 hover:bg-background" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          {ended || !q ? (
            <div>
              <div className="text-sm font-medium text-foreground">Atendimento finalizado</div>
              <div className="mt-1 text-xs text-muted-foreground">Caminho percorrido:</div>
              <ol className="mt-3 space-y-1">
                {path.map((id, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-xs text-primary">#{id}</span>
                    <span>{flow.questions[id]?.title}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Pergunta #{q.id} — Etapa {path.length}
              </div>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{q.title}</h2>
              {q.description && <p className="mt-1 text-sm text-muted-foreground">{q.description}</p>}
              <ul className="mt-4 space-y-2">
                {q.answers.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => {
                        if (a.target === "end") setEnded(true);
                        else setPath([...path, a.target as number]);
                      }}
                      className="flex w-full items-center gap-3 border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary hover:bg-secondary"
                    >
                      <MarkerDot marker={a.marker} />
                      <span className="flex-1">{a.text}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.target === "end" ? "Encerrar fluxo" : `→ #${a.target}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-border pt-3 text-xs text-muted-foreground">
                <span className="mr-2">Caminho:</span>
                {path.map((id, i) => (
                  <span key={i} className="font-mono">
                    #{id}
                    {i < path.length - 1 && " › "}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}