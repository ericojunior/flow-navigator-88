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
  const variantLabel =
    variant === "ancestor" ? "ANTERIOR DISTANTE" : variant === "parent" ? "PAI" : "ATUAL";

  return (
    <div
      className={`flex flex-col rounded bg-card ${
        isCurrent ? "border-2 border-primary shadow-sm" : "border border-border"
      }`}
    >
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-primary"
            style={{ backgroundColor: "#E6EEFB" }}
          >
            {q.id}
          </span>
          <StatusBadge status={status} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {variantLabel}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSelect(questionId)}
        className="px-3 pt-3 pb-3 text-left hover:bg-secondary/40"
      >
        <div className="text-base font-semibold text-foreground">{q.title}</div>
        {q.description && (
          <div className="mt-2 line-clamp-3 text-xs text-muted-foreground">{q.description}</div>
        )}
        <div className="mt-3 text-xs font-semibold text-foreground">
          {q.answers.length} resposta{q.answers.length === 1 ? "" : "s"}
        </div>
      </button>

      {isCurrent && (
        <div className="border-t border-border">
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Próximos destinos
          </div>
          <ul>
            {q.answers.map((a) => (
              <li key={a.id} className="flex items-center gap-2 px-3 py-1.5 text-sm">
                <MarkerDot marker={a.marker} />
                <span className="flex-1 truncate">{a.text}</span>
                <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                {a.target === "end" ? (
                  <span className="text-xs italic text-muted-foreground">Encerrar fluxo</span>
                ) : (
                  <button
                    onClick={() => onNavigate(a.target as number)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    {a.target}
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="px-3 pb-2" />
        </div>
      )}
    </div>
  );
}