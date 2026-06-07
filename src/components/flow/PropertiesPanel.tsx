import { useState } from "react";
import { useFlow } from "@/lib/flow-store";
import type { AnswerMarker, NoteEntry, NoteVisibility } from "@/lib/flow-types";
import { getNotes } from "@/lib/flow-types";
import { Trash2, Plus, Tags, FileText, Settings2, Eye, EyeOff, Globe } from "lucide-react";
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
  const toggleAnswerGroup = useFlow((s) => s.toggleAnswerGroup);
  const groups = flow.groups ?? [];
  const classifications = flow.classifications ?? [];
  const [groupsForAnswer, setGroupsForAnswer] = useState<string | null>(null);
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

        <NotesEditor
          notes={getNotes(q)}
          onChange={(notes) => updateQuestion(q.id, { notes, note: undefined })}
          label="Notas explicativas (pergunta)"
        />

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

                {/* Groups for this answer (attached to the destination) */}
                <div className="mt-2 border-t border-border pt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] uppercase text-muted-foreground">
                      <Tags className="h-3 w-3" /> Grupos do destino
                    </span>
                    <button
                      onClick={() => setGroupsForAnswer(a.id)}
                      className="inline-flex items-center gap-1 border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-secondary"
                    >
                      <Settings2 className="h-3 w-3" /> Selecionar
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(a.groupIds ?? []).length === 0 && (
                      <span className="text-[11px] text-muted-foreground">Nenhum grupo.</span>
                    )}
                    {(a.groupIds ?? []).map((gid) => {
                      const g = groups.find((x) => x.id === gid);
                      if (!g) return null;
                      return (
                        <span
                          key={gid}
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: `${g.color}1A`, color: g.color, border: `1px solid ${g.color}` }}
                        >
                          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: g.color }} />
                          {g.name}
                        </span>
                      );
                    })}
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

                <div className="mt-2 border-t border-border pt-2">
                  <NotesEditor
                    notes={getNotes(a)}
                    onChange={(notes) => updateAnswer(q.id, a.id, { notes, note: undefined })}
                    label="Notas da resposta"
                    compact
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {groupsForAnswer && (() => {
        const a = q.answers.find((x) => x.id === groupsForAnswer);
        if (!a) return null;
        return (
          <GroupsModal
            selectedIds={a.groupIds ?? []}
            onToggle={(gid) => toggleAnswerGroup(q.id, a.id, gid)}
            title="Grupos do destino da resposta"
            subtitle={`Resposta: "${a.text}"`}
            onClose={() => setGroupsForAnswer(null)}
          />
        );
      })()}
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

const visMeta: Record<NoteVisibility, { label: string; Icon: typeof Eye; tint: string }> = {
  internal: { label: "Interna", Icon: EyeOff, tint: "#6B7280" },
  external: { label: "Externa", Icon: Eye, tint: "#1351B4" },
  both: { label: "Ambas (interna + externa)", Icon: Globe, tint: "#00A859" },
};

function NotesEditor({
  notes,
  onChange,
  label,
  compact,
}: {
  notes: NoteEntry[];
  onChange: (notes: NoteEntry[]) => void;
  label: string;
  compact?: boolean;
}) {
  const hasBoth = notes.some((n) => n.visibility === "both");
  const hasInternal = notes.some((n) => n.visibility === "internal");
  const hasExternal = notes.some((n) => n.visibility === "external");
  const canAdd = !hasBoth && !(hasInternal && hasExternal);

  const update = (idx: number, patch: Partial<NoteEntry>) => {
    const next = notes.map((n, i) => (i === idx ? { ...n, ...patch } : n));
    onChange(next);
  };
  const remove = (idx: number) => onChange(notes.filter((_, i) => i !== idx));
  const addNote = () => {
    let visibility: NoteVisibility = "internal";
    if (hasInternal && !hasExternal) visibility = "external";
    onChange([...notes, { text: "", visibility }]);
  };

  const changeVisibility = (idx: number, newVis: NoteVisibility) => {
    let next = notes.map((n, i) => (i === idx ? { ...n, visibility: newVis } : n));
    // Enforce constraints: if newVis === "both", remove all others
    if (newVis === "both") next = [next[idx]];
    else {
      // remove any other note that now duplicates this visibility
      next = next.filter((n, i) => i === idx || n.visibility !== newVis);
      // if a "both" exists elsewhere, drop it (replaced by specific)
      next = next.filter((n, i) => i === idx || n.visibility !== "both");
    }
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className={`flex items-center gap-1 ${compact ? "text-[10px] uppercase text-muted-foreground" : "text-xs font-medium text-foreground"}`}>
          <FileText className="h-3 w-3" /> {label}
        </label>
        <button
          onClick={addNote}
          disabled={!canAdd}
          className="inline-flex items-center gap-1 border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          title={!canAdd ? "Limite atingido (até 2 notas: 1 interna + 1 externa, ou 1 'ambas')." : "Adicionar nota"}
        >
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {notes.length === 0 && (
        <p className="text-[11px] text-muted-foreground">Nenhuma nota. Clique em Adicionar para criar.</p>
      )}
      <ul className="space-y-2">
        {notes.map((n, idx) => {
          const meta = visMeta[n.visibility];
          const Icon = meta.Icon;
          return (
            <li key={idx} className="border border-border bg-background p-2">
              <div className="mb-1 flex items-center gap-2">
                <Icon className="h-3 w-3" style={{ color: meta.tint }} />
                <select
                  value={n.visibility}
                  onChange={(e) => changeVisibility(idx, e.target.value as NoteVisibility)}
                  className="flex-1 border border-input bg-background px-1 py-0.5 text-[11px]"
                >
                  <option value="internal">Interna (somente editor)</option>
                  <option value="external">Externa (visível na simulação)</option>
                  <option value="both">Ambas (interna + externa)</option>
                </select>
                <button
                  onClick={() => remove(idx)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label="Remover nota"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              <textarea
                value={n.text}
                onChange={(e) => update(idx, { text: e.target.value })}
                rows={2}
                placeholder={
                  n.visibility === "internal"
                    ? "Observação interna (não exibida ao usuário)."
                    : n.visibility === "external"
                      ? "Texto exibido ao usuário na simulação."
                      : "Texto exibido ao usuário e também usado como referência interna."
                }
                className="w-full resize-none border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}