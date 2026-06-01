import type { QuestionStatus } from "@/lib/flow-types";

const labels: Record<QuestionStatus, string> = {
  active: "Ativa",
  orphan: "Órfã",
  final: "Final",
  loop: "Loop",
};

const styles: Record<QuestionStatus, string> = {
  active: "bg-muted text-muted-foreground border-border",
  orphan: "bg-muted text-destructive border-destructive/40",
  final: "bg-muted text-foreground border-border",
  loop: "bg-muted text-warning border-warning/50",
};

export function StatusBadge({ status }: { status: QuestionStatus }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] uppercase tracking-wide border ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function MarkerDot({ marker }: { marker: "normal" | "positive" | "negative" | "warning" }) {
  const color =
    marker === "positive"
      ? "bg-success"
      : marker === "negative"
        ? "bg-destructive"
        : marker === "warning"
          ? "bg-warning"
          : "bg-muted-foreground";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}