import { useState } from "react";
import { useFlow } from "@/lib/flow-store";
import type { AnswerMarker, Classification } from "@/lib/flow-types";
import { X, Plus, Trash2, Check } from "lucide-react";
import { MarkerDot } from "./StatusBadge";

const markers: AnswerMarker[] = ["normal", "positive", "negative", "warning"];
const markerLabels: Record<AnswerMarker, string> = {
  normal: "Normal",
  positive: "Positivo",
  negative: "Negativo",
  warning: "Atenção",
};

export function ClassificationsModal({
  onClose,
  onPick,
  selectedId,
}: {
  onClose: () => void;
  onPick?: (id: string) => void;
  selectedId?: string;
}) {
  const classifications = useFlow((s) => s.flow.classifications ?? []);
  const addClassification = useFlow((s) => s.addClassification);
  const updateClassification = useFlow((s) => s.updateClassification);
  const removeClassification = useFlow((s) => s.removeClassification);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl border border-border bg-card shadow-lg" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Classificações de encerramento</div>
            <div className="text-xs text-muted-foreground">
              Catálogo reutilizável. {onPick ? "Clique em uma para selecionar." : "Edite ou crie novas."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const id = addClassification();
                setEditing(id);
              }}
              className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-xs hover:bg-secondary"
            >
              <Plus className="h-3 w-3" /> Nova
            </button>
            <button onClick={onClose} className="p-1 hover:bg-secondary" aria-label="Fechar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="max-h-[70vh] overflow-auto p-4">
          <ul className="space-y-2">
            {classifications.map((c) => (
              <ClassificationRow
                key={c.id}
                c={c}
                isEditing={editing === c.id}
                isSelected={selectedId === c.id}
                onEdit={(open) => setEditing(open ? c.id : null)}
                onChange={(patch) => updateClassification(c.id, patch)}
                onRemove={() => {
                  if (confirm(`Excluir classificação "${c.name}"? As respostas que a usam ficarão sem classificação.`)) {
                    removeClassification(c.id);
                  }
                }}
                onPick={onPick ? () => { onPick(c.id); onClose(); } : undefined}
              />
            ))}
            {classifications.length === 0 && (
              <li className="py-6 text-center text-xs text-muted-foreground">
                Nenhuma classificação cadastrada. Clique em "Nova" para começar.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ClassificationRow({
  c,
  isEditing,
  isSelected,
  onEdit,
  onChange,
  onRemove,
  onPick,
}: {
  c: Classification;
  isEditing: boolean;
  isSelected: boolean;
  onEdit: (open: boolean) => void;
  onChange: (patch: Partial<Classification>) => void;
  onRemove: () => void;
  onPick?: () => void;
}) {
  return (
    <li className={`border bg-background ${isSelected ? "border-primary" : "border-border"}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <MarkerDot marker={c.marker} />
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{c.name}</div>
          {c.code && <div className="text-[10px] font-mono text-muted-foreground">{c.code}</div>}
        </div>
        {onPick && (
          <button
            onClick={onPick}
            className="inline-flex items-center gap-1 border border-primary bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Check className="h-3 w-3" /> Selecionar
          </button>
        )}
        <button
          onClick={() => onEdit(!isEditing)}
          className="border border-border bg-background px-2 py-1 text-xs hover:bg-secondary"
        >
          {isEditing ? "Fechar" : "Editar"}
        </button>
        <button onClick={onRemove} className="p-1 text-muted-foreground hover:text-destructive" aria-label="Excluir">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {isEditing && (
        <div className="space-y-2 border-t border-border bg-secondary/30 p-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-0.5 block text-[10px] uppercase text-muted-foreground">Nome</label>
              <input
                value={c.name}
                onChange={(e) => onChange({ name: e.target.value })}
                className="w-full border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[10px] uppercase text-muted-foreground">Código (opcional)</label>
              <input
                value={c.code ?? ""}
                onChange={(e) => onChange({ code: e.target.value || undefined })}
                className="w-full border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
              />
            </div>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] uppercase text-muted-foreground">Marcador / cor</label>
            <select
              value={c.marker}
              onChange={(e) => onChange({ marker: e.target.value as AnswerMarker })}
              className="w-full border border-input bg-background px-2 py-1 text-xs"
            >
              {markers.map((m) => (
                <option key={m} value={m}>
                  {markerLabels[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[10px] uppercase text-muted-foreground">Nota / observação</label>
            <textarea
              value={c.note}
              onChange={(e) => onChange({ note: e.target.value })}
              rows={3}
              className="w-full resize-none border border-input bg-background px-2 py-1 text-xs outline-none focus:border-ring"
              placeholder="Texto exibido ao usuário ao chegar neste encerramento."
            />
          </div>
        </div>
      )}
    </li>
  );
}