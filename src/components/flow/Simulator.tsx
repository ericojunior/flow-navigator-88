import { useState } from "react";
import { useFlow } from "@/lib/flow-store";
import { getNotes } from "@/lib/flow-types";
import { MarkerDot } from "./StatusBadge";
import { X, RotateCcw, Undo2, FileText } from "lucide-react";

export function Simulator({ onClose }: { onClose: () => void }) {
  const flow = useFlow((s) => s.flow);
  const [path, setPath] = useState<number[]>([flow.rootId]);
  const [ended, setEnded] = useState(false);
  const [endingAnswerId, setEndingAnswerId] = useState<string | null>(null);
  const current = path[path.length - 1];
  const q = flow.questions[current];
  const classifications = flow.classifications ?? [];
  const groups = flow.groups ?? [];
  const endingQuestion = ended ? flow.questions[path[path.length - 1]] : null;
  const endingAnswer =
    endingQuestion && endingAnswerId
      ? endingQuestion.answers.find((a) => a.id === endingAnswerId)
      : null;
  const endingGroup =
    endingAnswer?.targetGroupId
      ? groups.find((g) => g.id === endingAnswer.targetGroupId)
      : null;
  const endingClassif = endingAnswer?.classificationId
    ? classifications.find((c) => c.id === endingAnswer.classificationId)
    : null;
  const endingNote =
    endingAnswer?.classificationNoteOverride ?? endingClassif?.note ?? "";

  const reset = () => {
    setPath([flow.rootId]);
    setEnded(false);
    setEndingAnswerId(null);
  };
  const back = () => {
    if (ended) {
      setEnded(false);
      setEndingAnswerId(null);
      return;
    }
    if (path.length > 1) setPath(path.slice(0, -1));
  };

  const markerColor = (m?: string) =>
    m === "positive"
      ? "#00A859"
      : m === "negative"
        ? "#C0392B"
        : m === "warning"
          ? "#FFCD07"
          : "#6B7280";

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
              {endingGroup ? (
                <div
                  className="mt-3 border-l-4 bg-secondary/30 p-3"
                  style={{ borderColor: endingGroup.color }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: endingGroup.color }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      Encaminhado ao grupo: {endingGroup.name}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    O atendimento segue dentro do grupo de perguntas selecionado.
                  </p>
                </div>
              ) : endingClassif ? (
                <div
                  className="mt-3 border-l-4 bg-secondary/30 p-3"
                  style={{ borderColor: markerColor(endingClassif.marker) }}
                >
                  <div className="flex items-center gap-2">
                    <MarkerDot marker={endingClassif.marker} />
                    <span className="text-sm font-semibold text-foreground">{endingClassif.name}</span>
                    {endingClassif.code && (
                      <span className="font-mono text-[10px] text-muted-foreground">{endingClassif.code}</span>
                    )}
                  </div>
                  {endingNote && (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-foreground">{endingNote}</p>
                  )}
                </div>
              ) : (
                endingAnswer?.note && (
                  <p className="mt-3 whitespace-pre-wrap text-xs text-foreground">{endingAnswer.note}</p>
                )
              )}
              <div className="mt-4 text-xs text-muted-foreground">Caminho percorrido:</div>
              <ol className="mt-2 space-y-1">
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
              {q.note && (
                <div className="mt-3 flex gap-2 border border-border bg-secondary/40 p-2 text-xs text-foreground">
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="whitespace-pre-wrap">{q.note}</p>
                </div>
              )}
              {getNotes(q)
                .filter((n) => n.visibility === "external" || n.visibility === "both")
                .map((n, i) => (
                  <div key={i} className="mt-3 flex gap-2 border border-border bg-secondary/40 p-2 text-xs text-foreground">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <p className="whitespace-pre-wrap">{n.text}</p>
                  </div>
                ))}
              <ul className="mt-4 space-y-2">
                {q.answers.map((a) => {
                  const classif = a.classificationId
                    ? classifications.find((c) => c.id === a.classificationId)
                    : null;
                  const grp = a.targetGroupId
                    ? groups.find((g) => g.id === a.targetGroupId)
                    : null;
                  return (
                    <li key={a.id}>
                      <button
                        onClick={() => {
                          if (a.targetGroupId || a.target === "end") {
                            setEndingAnswerId(a.id);
                            setEnded(true);
                          } else {
                            setPath([...path, a.target as number]);
                          }
                        }}
                        className="flex w-full flex-col gap-1 border border-border bg-background px-3 py-2 text-left text-sm hover:border-primary hover:bg-secondary"
                      >
                        <div className="flex w-full items-center gap-3">
                          <MarkerDot marker={a.marker} />
                          <span className="flex-1">{a.text}</span>
                          <span className="text-xs text-muted-foreground">
                            {grp
                              ? `→ Grupo · ${grp.name}`
                              : a.target === "end"
                              ? classif
                                ? `Encerrar · ${classif.name}`
                                : "Encerrar fluxo"
                              : `→ #${a.target}`}
                          </span>
                        </div>
                        {a.note && (
                          <span className="pl-6 text-[11px] text-muted-foreground">{a.note}</span>
                        )}
                        {getNotes(a)
                          .filter((n) => n.visibility === "external" || n.visibility === "both")
                          .map((n, i) => (
                            <span key={i} className="pl-6 text-[11px] text-muted-foreground">
                              {n.text}
                            </span>
                          ))}
                      </button>
                    </li>
                  );
                })}
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