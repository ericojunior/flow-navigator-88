import { useFlow } from "@/lib/flow-store";
import type { AnswerMarker } from "@/lib/flow-types";
import { Trash2, Plus } from "lucide-react";
import { MarkerDot } from "./StatusBadge";

export function PropertiesPanel({ questionId }: { questionId: number }) {
  const flow = useFlow((s) => s.flow);
  const q = flow.questions[questionId];
  const updateQuestion = useFlow((s) => s.updateQuestion);
  const updateAnswer = useFlow((s) => s.updateAnswer);
  const addAnswer = useFlow((s) => s.addAnswer);
  const removeAnswer = useFlow((s) => s.removeAnswer);

  if (!q) {
    return <div className="p-4 text-xs text-muted-foreground">Selecione uma pergunta.</div>;
  }

  const markers: AnswerMarker[] = ["normal", "positive", "negative", "warning"];
  const markerLabels: Record<AnswerMarker, string> = {
    normal: "Normal",
    positive: "Positivo",
    negative: "Negativo",
    warning: "Atenção",
  };

  return (
    <div className="flex flex-col bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-primary"
            style={{ backgroundColor: "#E6EEFB" }}
          >
            {q.id}
          </span>
          <span className="truncate text-sm font-medium text-foreground">{q.title}</span>
        </div>
      </div>
      <div className="max-h-[700px] overflow-auto p-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Título</label>
          <input
            value={q.title}
            onChange={(e) => updateQuestion(q.id, { title: e.target.value })}
            className="w-full border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Descrição</label>
          <textarea
            value={q.description}
            onChange={(e) => updateQuestion(q.id, { description: e.target.value })}
            rows={3}
            className="w-full resize-none border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Respostas</label>
            <button
              onClick={() => addAnswer(q.id)}
              className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          <ul className="space-y-2">
            {q.answers.map((a) => (
              <li key={a.id} className="border border-border bg-background p-2">
                <div className="flex items-center gap-2">
                  <MarkerDot marker={a.marker} />
                  <input
                    value={a.text}
                    onChange={(e) => updateAnswer(q.id, a.id, { text: e.target.value })}
                    className="flex-1 border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
                  />
                  <button
                    onClick={() => removeAnswer(q.id, a.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-0.5 text-[10px] uppercase text-muted-foreground">Destino</div>
                    <select
                      value={a.target === "end" ? "end" : String(a.target)}
                      onChange={(e) =>
                        updateAnswer(q.id, a.id, {
                          target: e.target.value === "end" ? "end" : Number(e.target.value),
                        })
                      }
                      className="w-full border border-input bg-background px-1 py-1 text-xs"
                    >
                      <option value="end">Encerrar fluxo</option>
                      {Object.keys(flow.questions)
                        .map(Number)
                        .filter((id) => id !== q.id)
                        .slice(0, 500)
                        .map((id) => (
                          <option key={id} value={id}>
                            #{id} {flow.questions[id].title.slice(0, 28)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[10px] uppercase text-muted-foreground">Marcador</div>
                    <select
                      value={a.marker}
                      onChange={(e) =>
                        updateAnswer(q.id, a.id, { marker: e.target.value as AnswerMarker })
                      }
                      className="w-full border border-input bg-background px-1 py-1 text-xs"
                    >
                      {markers.map((m) => (
                        <option key={m} value={m}>
                          {markerLabels[m]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}