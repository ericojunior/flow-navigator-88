import { useFlow } from "@/lib/flow-store";

export function MiniMap({ currentId }: { currentId: number }) {
  const flow = useFlow((s) => s.flow);
  const ids = Object.keys(flow.questions).map(Number).sort((a, b) => a - b);
  const total = ids.length;
  // Render up to 240 dots, sample if larger
  const step = Math.max(1, Math.ceil(total / 240));
  const sample: number[] = [];
  for (let i = 0; i < total; i += step) sample.push(ids[i]);
  return (
    <div className="border border-border bg-card p-2">
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>Mini mapa</span>
        <span className="font-mono">{total}</span>
      </div>
      <div className="flex flex-wrap gap-[2px]">
        {sample.map((id) => {
          const active = id === currentId || (currentId >= id && currentId < id + step);
          return (
            <span
              key={id}
              className={`h-1.5 w-1.5 ${active ? "bg-primary" : "bg-border"}`}
              title={`#${id}`}
            />
          );
        })}
      </div>
    </div>
  );
}