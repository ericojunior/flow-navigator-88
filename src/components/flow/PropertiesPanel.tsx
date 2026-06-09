import { useState } from "react";
import { useFlow } from "@/lib/flow-store";
import type { NoteEntry, NoteVisibility } from "@/lib/flow-types";
import { getNotes } from "@/lib/flow-types";
import {
  Trash2,
  Plus,
  FileText,
  Eye,
  EyeOff,
  Globe,
  Repeat,
  ListPlus,
  HelpCircle,
  ListChecks,
} from "lucide-react";
import { ClassificationsModal } from "./ClassificationsModal";
import { PickerModal, type PickerItem } from "./PickerModal";

export function PropertiesPanel({ questionId }: { questionId: number }) {
  const flow = useFlow((s) => s.flow);
  const q = flow.questions[questionId];
  const updateQuestion = useFlow((s) => s.updateQuestion);
  const updateAnswer = useFlow((s) => s.updateAnswer);
  const addAnswer = useFlow((s) => s.addAnswer);
  const removeAnswer = useFlow((s) => s.removeAnswer);
  const addQuestionCatalogItem = useFlow((s) => s.addQuestionCatalogItem);
  const addAnswerCatalogItem = useFlow((s) => s.addAnswerCatalogItem);
  const addNoteCatalogItem = useFlow((s) => s.addNoteCatalogItem);
  const groups = flow.groups ?? [];
  const classifications = flow.classifications ?? [];
  const questionCatalog = flow.questionCatalog ?? [];
  const answerCatalog = flow.answerCatalog ?? [];
  const noteCatalog = flow.noteCatalog ?? [];
  const [classifOpen, setClassifOpen] = useState(false);
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false);
  const [answerPickerFor, setAnswerPickerFor] = useState<"new" | string | null>(null);
  const [notePickerFor, setNotePickerFor] = useState<
    { scope: "question" } | { scope: "answer"; aid: string } | null
  >(null);
  const [tab, setTab] = useState<"question" | "answers">("question");

  if (!q) {
    return <div className="p-4 text-xs text-muted-foreground">Selecione uma pergunta.</div>;
  }

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
      <div className="grid grid-cols-2 gap-3 border-b border-border bg-secondary/30 px-4 py-3">
        <IconTab
          active={tab === "question"}
          onClick={() => setTab("question")}
          Icon={HelpCircle}
          label="Pergunta"
        />
        <IconTab
          active={tab === "answers"}
          onClick={() => setTab("answers")}
          Icon={ListChecks}
          label={`Respostas${q.answers.length ? ` (${q.answers.length})` : ""}`}
        />
      </div>
      <div className="max-h-[700px] overflow-auto p-4 space-y-4">
        {tab === "question" && (
        <>
        {/* Question (from catalog) */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Pergunta (catálogo)</label>
            <button
              onClick={() => setQuestionPickerOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-primary px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
            >
              <Repeat className="h-3 w-3" /> Trocar pergunta
            </button>
          </div>
          <div className="border border-border bg-background px-3 py-2 text-sm text-foreground">
            {q.title}
          </div>
          {q.description && (
            <p className="mt-1 text-[11px] text-muted-foreground">{q.description}</p>
          )}
        </div>

        <NotesBlock
          notes={getNotes(q)}
          onChange={(notes) => updateQuestion(q.id, { notes, note: undefined })}
          onAdd={() => setNotePickerFor({ scope: "question" })}
          label="Notas explicativas (pergunta)"
        />
        </>
        )}

        {tab === "answers" && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">Respostas</label>
            <button
              onClick={() => setAnswerPickerFor("new")}
              className="inline-flex items-center gap-1 rounded-full border border-primary px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
            >
              <ListPlus className="h-3 w-3" /> Adicionar resposta
            </button>
          </div>
          <ul className="space-y-2">
            {q.answers.map((a) => (
              <li key={a.id} className="border border-border bg-background p-2">
                <div className="flex items-start gap-2">
                  <span className="flex-1 text-xs text-foreground">{a.text}</span>
                  <button
                    onClick={() => setAnswerPickerFor(a.id)}
                    className="p-1 text-primary hover:bg-secondary"
                    aria-label="Trocar resposta"
                    title="Trocar resposta"
                  >
                    <Repeat className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => removeAnswer(q.id, a.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2">
                  <div className="mb-0.5 text-[10px] uppercase text-muted-foreground">Próximo destino</div>
                  <select
                    value={
                      a.targetGroupId
                        ? `g:${a.targetGroupId}`
                        : a.target === "end"
                          ? "end"
                          : `q:${a.target}`
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "end") {
                        updateAnswer(q.id, a.id, { target: "end", targetGroupId: undefined });
                      } else if (v.startsWith("g:")) {
                        updateAnswer(q.id, a.id, { target: "end", targetGroupId: v.slice(2) });
                      } else {
                        updateAnswer(q.id, a.id, {
                          target: Number(v.slice(2)),
                          targetGroupId: undefined,
                        });
                      }
                    }}
                    className="w-full border border-input bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="end">Encerrar fluxo</option>
                    <optgroup label="Perguntas">
                      {Object.keys(flow.questions)
                        .map(Number)
                        .filter((id) => id !== q.id)
                        .slice(0, 500)
                        .map((id) => (
                          <option key={id} value={`q:${id}`}>
                            #{id} {flow.questions[id].title.slice(0, 40)}
                          </option>
                        ))}
                    </optgroup>
                    {groups.length > 0 && (
                      <optgroup label="Grupos de perguntas">
                        {groups.map((g) => (
                          <option key={g.id} value={`g:${g.id}`}>
                            ▣ {g.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {a.target === "end" && !a.targetGroupId && (
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
                            classificationNoteOverride: e.target.value
                              ? a.classificationNoteOverride
                              : undefined,
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
                  </div>
                )}

                <div className="mt-2 border-t border-border pt-2">
                  <NotesBlock
                    notes={getNotes(a)}
                    onChange={(notes) => updateAnswer(q.id, a.id, { notes, note: undefined })}
                    onAdd={() => setNotePickerFor({ scope: "answer", aid: a.id })}
                    label="Notas da resposta"
                    compact
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>

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

      {questionPickerOpen && (
        <PickerModal
          title="Selecionar pergunta do catálogo"
          primaryLabel="Pergunta"
          searchHint="Filtro de pesquisa. Digite a pergunta pela qual deseja pesquisar"
          items={questionCatalog.map<PickerItem>((c) => ({
            id: c.id,
            primary: c.title,
            secondary: c.description,
            active: c.active,
          }))}
          selectedId={q.catalogId}
          onPick={(cid) => {
            const cat = questionCatalog.find((c) => c.id === cid);
            if (cat)
              updateQuestion(q.id, {
                title: cat.title,
                description: cat.description ?? "",
                catalogId: cat.id,
              });
          }}
          onClose={() => setQuestionPickerOpen(false)}
          onCreate={(text) => addQuestionCatalogItem({ title: text, active: true })}
        />
      )}

      {answerPickerFor && (
        <PickerModal
          title={
            answerPickerFor === "new" ? "Selecionar resposta do catálogo" : "Trocar resposta"
          }
          primaryLabel="Resposta"
          searchHint="Filtro de pesquisa. Digite a resposta pela qual deseja pesquisar"
          items={answerCatalog.map<PickerItem>((c) => ({
            id: c.id,
            primary: c.text,
            active: c.active,
          }))}
          selectedId={
            answerPickerFor !== "new"
              ? q.answers.find((x) => x.id === answerPickerFor)?.catalogId
              : undefined
          }
          onPick={(cid) => {
            const cat = answerCatalog.find((c) => c.id === cid);
            if (!cat) return;
            if (answerPickerFor === "new") {
              addAnswer(q.id, cid);
            } else {
              updateAnswer(q.id, answerPickerFor, {
                text: cat.text,
                catalogId: cat.id,
              });
            }
          }}
          onClose={() => setAnswerPickerFor(null)}
          onCreate={(text) => addAnswerCatalogItem({ text, active: true })}
        />
      )}

      {notePickerFor && (
        <PickerModal
          title="Selecionar nota explicativa"
          primaryLabel="Nota"
          searchHint="Filtro de pesquisa. Digite o texto da nota."
          items={noteCatalog.map<PickerItem>((n) => ({
            id: n.id,
            primary: n.title,
            secondary: n.text,
            active: n.active,
          }))}
          onPick={(cid) => {
            const cat = noteCatalog.find((c) => c.id === cid);
            if (!cat) return;
            const target =
              notePickerFor.scope === "question"
                ? getNotes(q)
                : getNotes(q.answers.find((x) => x.id === notePickerFor.aid));
            const hasBoth = target.some((n) => n.visibility === "both");
            const hasInternal = target.some((n) => n.visibility === "internal");
            const hasExternal = target.some((n) => n.visibility === "external");
            if (hasBoth || (hasInternal && hasExternal)) return;
            const visibility: NoteVisibility =
              hasInternal && !hasExternal ? "external" : "internal";
            const next: NoteEntry[] = [...target, { text: cat.text, visibility }];
            if (notePickerFor.scope === "question") {
              updateQuestion(q.id, { notes: next, note: undefined });
            } else {
              updateAnswer(q.id, notePickerFor.aid, { notes: next, note: undefined });
            }
          }}
          onClose={() => setNotePickerFor(null)}
          onCreate={(text) =>
            addNoteCatalogItem({ title: text.slice(0, 40), text, active: true })
          }
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

function IconTab({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Eye;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex aspect-square min-h-[7rem] flex-col items-center justify-center gap-2 rounded-[24px] border text-sm font-semibold transition-colors ${
        active
          ? "border-primary bg-card text-primary shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-card hover:text-primary"
      }`}
      aria-pressed={active}
    >
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-[14px] transition-colors ${
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-primary group-hover:bg-primary/10"
        }`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="max-w-full px-2 text-center leading-tight">{label}</span>
    </button>
  );
}

function NotesBlock({
  notes,
  onChange,
  onAdd,
  label,
  compact,
}: {
  notes: NoteEntry[];
  onChange: (notes: NoteEntry[]) => void;
  onAdd: () => void;
  label: string;
  compact?: boolean;
}) {
  const hasBoth = notes.some((n) => n.visibility === "both");
  const hasInternal = notes.some((n) => n.visibility === "internal");
  const hasExternal = notes.some((n) => n.visibility === "external");
  const canAdd = !hasBoth && !(hasInternal && hasExternal);

  const remove = (idx: number) => onChange(notes.filter((_, i) => i !== idx));

  const changeVisibility = (idx: number, newVis: NoteVisibility) => {
    let next = notes.map((n, i) => (i === idx ? { ...n, visibility: newVis } : n));
    if (newVis === "both") next = [next[idx]];
    else {
      next = next.filter((n, i) => i === idx || n.visibility !== newVis);
      next = next.filter((n, i) => i === idx || n.visibility !== "both");
    }
    onChange(next);
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label
          className={`flex items-center gap-1 ${
            compact ? "text-[10px] uppercase text-muted-foreground" : "text-xs font-medium text-foreground"
          }`}
        >
          <FileText className="h-3 w-3" /> {label}
        </label>
        <button
          onClick={onAdd}
          disabled={!canAdd}
          className="inline-flex items-center gap-1 rounded-full border border-primary px-3 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
          title={
            !canAdd
              ? "Limite atingido (até 2 notas: 1 interna + 1 externa, ou 1 'ambas')."
              : "Adicionar nota do catálogo"
          }
        >
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
      {notes.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Nenhuma nota. Clique em Adicionar para escolher do catálogo.
        </p>
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
              <p className="whitespace-pre-wrap rounded border border-dashed border-border bg-secondary/30 px-2 py-1 text-xs text-foreground">
                {n.text || <span className="italic text-muted-foreground">(vazia)</span>}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
