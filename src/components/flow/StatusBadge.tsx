import type { QuestionStatus } from "@/lib/flow-types";

const labels: Record<QuestionStatus, string> = {
  active: "Ativa",
  orphan: "Órfã",
  final: "Final",
  loop: "Loop",
};

const styles: Record<QuestionStatus, string> = {
  active: "bg-primary text-primary-foreground border-primary",
  orphan: "bg-card text-destructive border-destructive/50",
  final: "bg-card text-muted-foreground border-border",
  loop: "bg-card text-warning border-warning/60",
};

export function StatusBadge({ status }: { status: QuestionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide border ${styles[status]}`}
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