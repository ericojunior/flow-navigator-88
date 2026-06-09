import { useFlow } from "@/lib/flow-store";
import { Lock } from "lucide-react";

/**
 * Read-only properties for a Question Group that is being used as the
 * destination of an answer. The only editable field is the group's own
 * next destination (a question).
 */
export function GroupPanel({ groupId }: { groupId: string }) {
  const flow = useFlow((s) => s.flow);
  const updateGroup = useFlow((s) => s.updateGroup);
  const group = (flow.groups ?? []).find((g) => g.id === groupId);

  if (!group) {
    return <div className="p-4 text-xs text-muted-foreground">Grupo não encontrado.</div>;
  }

  const questionIds = Object.keys(flow.questions).map(Number);

  return (
    <div className="flex flex-col bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ backgroundColor: `${group.color}1A` }}
          >
            <Lock className="h-3.5 w-3.5" style={{ color: group.color }} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{group.name}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Grupo de perguntas · somente leitura
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div className="border border-dashed border-border bg-secondary/30 px-3 py-2 text-[11px] text-muted-foreground">
          Este nó é um grupo de perguntas usado como destino. Apenas o próximo
          destino pode ser definido aqui.
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">
            Próximo destino do grupo
          </label>
          <select
            value={group.targetQuestionId ?? ""}
            onChange={(e) =>
              updateGroup(group.id, {
                targetQuestionId: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full border border-input bg-background px-2 py-1.5 text-xs"
          >
            <option value="">— Sem destino definido —</option>
            {questionIds.map((id) => (
              <option key={id} value={id}>
                #{id} {flow.questions[id].title.slice(0, 60)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}