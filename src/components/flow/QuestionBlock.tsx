import { useFlow, getStatus } from "@/lib/flow-store";
import { StatusBadge, MarkerDot } from "./StatusBadge";
import { ChevronRight, CornerDownRight } from "lucide-react";

interface Props {
  questionId: number;
  variant: "ancestor" | "parent" | "current";
  onSelect: (id: number) => void;
  onNavigate: (id: number) => void;
}

export function QuestionBlock({ questionId, variant, onSelect, onNavigate }: Props) {
  const flow = useFlow((s) => s.flow);
  const q = flow.questions[questionId];
  if (!q) {
    return (
      <div className="border border-border bg-card p-3 text-xs text-muted-foreground">
        Pergunta #{questionId} não encontrada
      </div>
    );
  }
  const status = getStatus(flow, questionId);
  const isCurrent = variant === "current";

  return (
    <div
      className={`flex flex-col border bg-card ${
        isCurrent ? "border-primary shadow-sm" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border bg-secondary px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-primary">#{q.id}</span>
          <StatusBadge status={status} />
        </div>
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {variant === "ancestor" ? "Anterior distante" : variant === "parent" ? "Pai" : "Atual"}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSelect(questionId)}
        className="px-3 py-3 text-left hover:bg-secondary/60"
      >
        <div className="text-sm font-medium text-foreground">{q.title}</div>
        {q.description && (
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{q.description}</div>
        )}
        <div className="mt-2 text-[11px] text-muted-foreground">
          {q.answers.length} resposta{q.answers.length === 1 ? "" : "s"}
        </div>
      </button>

      {isCurrent && (
        <div className="border-t border-border">
          <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Próximos destinos
          </div>
          <ul className="divide-y divide-border">
            {q.answers.map((a) => (
              <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <MarkerDot marker={a.marker} />
                <span className="flex-1 truncate">{a.text}</span>
                <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                {a.target === "end" ? (
                  <span className="text-xs text-muted-foreground">Encerrar fluxo</span>
                ) : (
                  <button
                    onClick={() => onNavigate(a.target as number)}
                    className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                  >
                    #{a.target}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}