import { useState } from "react";
import { useFlow } from "@/lib/flow-store";
import { X, Plus, Trash2, Check } from "lucide-react";

export function GroupsModal({
  questionId,
  onClose,
}: {
  questionId: number;
  onClose: () => void;
}) {
  const flow = useFlow((s) => s.flow);
  const addGroup = useFlow((s) => s.addGroup);
  const updateGroup = useFlow((s) => s.updateGroup);
  const removeGroup = useFlow((s) => s.removeGroup);
  const toggleQuestionGroup = useFlow((s) => s.toggleQuestionGroup);
  const q = flow.questions[questionId];
  const [name, setName] = useState("");
  const groups = flow.groups ?? [];
  const selected = new Set(q?.groupIds ?? []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Grupos de perguntas</div>
            <div className="text-xs text-muted-foreground">Marque os grupos aos quais esta pergunta pertence.</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[60vh] space-y-3 overflow-auto p-4">
          <ul className="space-y-1.5">
            {groups.map((g) => {
              const on = selected.has(g.id);
              return (
                <li key={g.id} className="flex items-center gap-2 border border-border bg-background px-2 py-1.5">
                  <button
                    onClick={() => toggleQuestionGroup(questionId, g.id)}
                    className={`flex h-5 w-5 items-center justify-center border ${
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background"
                    }`}
                    aria-label={on ? "Remover" : "Associar"}
                  >
                    {on && <Check className="h-3 w-3" />}
                  </button>
                  <input
                    type="color"
                    value={g.color}
                    onChange={(e) => updateGroup(g.id, { color: e.target.value })}
                    className="h-6 w-7 cursor-pointer border border-input bg-background p-0.5"
                    aria-label="Cor"
                  />
                  <input
                    value={g.name}
                    onChange={(e) => updateGroup(g.id, { name: e.target.value })}
                    className="flex-1 border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
                  />
                  <button
                    onClick={() => removeGroup(g.id)}
                    className="p-1 text-muted-foreground hover:text-destructive"
                    aria-label="Excluir grupo"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
            {groups.length === 0 && (
              <li className="px-1 py-4 text-center text-xs text-muted-foreground">Nenhum grupo cadastrado.</li>
            )}
          </ul>

          <div className="flex items-center gap-2 border-t border-border pt-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do novo grupo"
              className="flex-1 border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-ring"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  addGroup(name);
                  setName("");
                }
              }}
            />
            <button
              onClick={() => {
                if (name.trim()) {
                  addGroup(name);
                  setName("");
                }
              }}
              className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1.5 text-xs hover:bg-secondary"
            >
              <Plus className="h-3 w-3" /> Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}