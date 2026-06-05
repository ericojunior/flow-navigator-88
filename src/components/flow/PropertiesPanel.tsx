import { useState } from "react";
import { useFlow } from "@/lib/flow-store";
import type { AnswerMarker } from "@/lib/flow-types";
import { Trash2, Plus, Tags, FileText, Settings2 } from "lucide-react";
import { MarkerDot } from "./StatusBadge";
import { GroupsModal } from "./GroupsModal";
import { ClassificationsModal } from "./ClassificationsModal";

export function PropertiesPanel({ questionId }: { questionId: number }) {
  const flow = useFlow((s) => s.flow);
  const q = flow.questions[questionId];
  const updateQuestion = useFlow((s) => s.updateQuestion);
  const updateAnswer = useFlow((s) => s.updateAnswer);
  const addAnswer = useFlow((s) => s.addAnswer);
  const removeAnswer = useFlow((s) => s.removeAnswer);
  const groups = flow.groups ?? [];
  const classifications = flow.classifications ?? [];
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [classifOpen, setClassifOpen] = useState(false);
  const [pickFor, setPickFor] = useState<string | null>(null); // answer id awaiting classification pick

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
  const questionGroups = (q.groupIds ?? []).map((id) => groups.find((g) => g.id === id)).filter(Boolean);

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
          <label className="mb-1 flex items-center gap-1 text-xs font-medium text-foreground">
            <FileText className="h-3 w-3" /> Nota explicativa
          </label>
          <textarea
            value={q.note ?? ""}
            onChange={(e) => updateQuestion(q.id, { note: e.target.value })}
            rows={2}
            placeholder="Texto adicional exibido ao usuário ao chegar nesta pergunta."
            className="w-full resize-none border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-ring"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="flex items-center gap-1 text-xs font-medium text-foreground">
              <Tags className="h-3 w-3" /> Grupos
            </label>
            <button
              onClick={() => setGroupsOpen(true)}
              className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary"
            >
              <Settings2 className="h-3 w-3" /> Gerenciar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {questionGroups.length === 0 && (
              <span className="text-[11px] text-muted-foreground">Nenhum grupo associado.</span>
            )}
            {questionGroups.map(
              (g) =>
                g && (
                  <span
                    key={g.id}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${g.color}1A`, color: g.color, border: `1px solid ${g.color}` }}
                  >
                    <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                    {g.name}
                  </span>
                )
            )}
          </div>
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

                {a.target === "end" && (
                  <div className="mt-2 border-t border-border pt-2">
                    <div className="mb-0.5 flex items-center justify-between text-[10px] uppercase text-muted-foreground">
                      <span>Classificação de encerramento</span>
                      <button
                        onClick={() => setClassifOpen(true)}
                        className="text-primary hover:underline"
                      >
                        Gerenciar catálogo
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        value={a.classificationId ?? ""}
                        onChange={(e) =>
                          updateAnswer(q.id, a.id, {
                            classificationId: e.target.value || undefined,
                            classificationNoteOverride: e.target.value ? a.classificationNoteOverride : undefined,
                          })
                        }
                        className="flex-1 border border-input bg-background px-1 py-1 text-xs"
                      >
                        <option value="">— Sem classificação —</option>
                        {classifications.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                            {c.code ? ` (${c.code})` : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          setPickFor(a.id);
                          setClassifOpen(true);
                        }}
                        className="border border-border bg-background px-2 py-1 text-[11px] hover:bg-secondary"
                        title="Escolher do catálogo"
                      >
                        ⋯
                      </button>
                    </div>
                    {a.classificationId && (
                      <div className="mt-2">
                        <div className="mb-0.5 text-[10px] uppercase text-muted-foreground">
                          Nota exibida ao usuário (sobrescreve a do catálogo se preenchida)
                        </div>
                        <textarea
                          value={
                            a.classificationNoteOverride ??
                            classifications.find((c) => c.id === a.classificationId)?.note ??
                            ""
                          }
                          onChange={(e) =>
                            updateAnswer(q.id, a.id, { classificationNoteOverride: e.target.value })
                          }
                          rows={2}
                          className="w-full resize-none border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
                        />
                        {a.classificationNoteOverride && (
                          <button
                            onClick={() =>
                              updateAnswer(q.id, a.id, { classificationNoteOverride: undefined })
                            }
                            className="mt-1 text-[10px] text-primary hover:underline"
                          >
                            Restaurar nota do catálogo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-2">
                  <div className="mb-0.5 text-[10px] uppercase text-muted-foreground">Nota da resposta</div>
                  <textarea
                    value={a.note ?? ""}
                    onChange={(e) => updateAnswer(q.id, a.id, { note: e.target.value })}
                    rows={1}
                    placeholder="Observação interna ou exibida na simulação."
                    className="w-full resize-none border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {groupsOpen && <GroupsModal questionId={q.id} onClose={() => setGroupsOpen(false)} />}
      {classifOpen && (
        <ClassificationsModal
          onClose={() => {
            setClassifOpen(false);
            setPickFor(null);
          }}
          onPick={
            pickFor
              ? (cid) => {
                  updateAnswer(q.id, pickFor, { classificationId: cid });
                  setPickFor(null);
                }
              : undefined
          }
          selectedId={pickFor ? q.answers.find((x) => x.id === pickFor)?.classificationId : undefined}
        />
      )}
    </div>
  );
}