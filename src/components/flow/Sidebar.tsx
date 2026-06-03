import { useMemo, useState } from "react";
import { useFlow, diagnose, getStatus } from "@/lib/flow-store";
import { Search, AlertTriangle, GitBranch, Repeat, Flag } from "lucide-react";

type Filter = "all" | "orphans" | "noTarget" | "loops" | "finals";

export function FlowSidebar({
  currentId,
  onSelect,
}: {
  currentId: number;
  onSelect: (id: number) => void;
}) {
  const flow = useFlow((s) => s.flow);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const diag = useMemo(() => diagnose(flow), [flow]);

  const ids = useMemo(() => {
    const all = Object.keys(flow.questions).map(Number).sort((a, b) => a - b);
    let pool = all;
    if (filter === "orphans") pool = diag.orphans;
    else if (filter === "noTarget") pool = Array.from(new Set(diag.danglingAnswers.map((d) => d.qid)));
    else if (filter === "loops") pool = diag.loops;
    else if (filter === "finals") pool = diag.finals;
    if (!q.trim()) return pool.slice(0, 200);
    const term = q.toLowerCase();
    return pool.filter((id) => {
      const ques = flow.questions[id];
      if (!ques) return false;
      if (String(id).includes(term)) return true;
      if (ques.title.toLowerCase().includes(term)) return true;
      if (ques.answers.some((a) => a.text.toLowerCase().includes(term))) return true;
      return false;
    }).slice(0, 200);
  }, [flow, q, filter, diag]);

  const filters: { key: Filter; label: string; icon: typeof Search; count?: number }[] = [
    { key: "all", label: "Todas", icon: GitBranch },
    { key: "orphans", label: "Órfãs", icon: AlertTriangle, count: diag.orphans.length },
    { key: "noTarget", label: "Sem destino", icon: AlertTriangle, count: diag.danglingAnswers.length },
    { key: "loops", label: "Loops", icon: Repeat, count: diag.loops.length },
    { key: "finals", label: "Finais", icon: Flag, count: diag.finals.length },
  ];

  return (
    <aside className="flex h-full w-full flex-col rounded border border-border bg-card">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por ID, Título ou Respostas"
            className="w-full rounded-full border border-input bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-ring"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-b border-border p-2">
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-primary hover:bg-secondary"
              }`}
            >
              <f.icon className="h-3 w-3" />
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className="ml-0.5 font-mono">{f.count}</span>
              )}
            </button>
          );
        })}
      </div>
      <div className="max-h-[640px] flex-1 overflow-auto">
        <ul>
          {ids.map((id) => {
            const ques = flow.questions[id];
            const status = getStatus(flow, id);
            const active = id === currentId;
            const isFinal = status === "final";
            return (
              <li key={id}>
                <button
                  onClick={() => onSelect(id)}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary ${
                    active ? "bg-secondary" : ""
                  }`}
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary"
                    style={{ backgroundColor: "#E6EEFB" }}
                  >
                    {id}
                  </span>
                  <span className="flex-1 truncate text-foreground">{ques.title}</span>
                  {isFinal && (
                    <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      Final
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {ids.length === 0 && (
            <li className="p-3 text-xs text-muted-foreground">Nenhum resultado.</li>
          )}
        </ul>
      </div>
    </aside>
  );
}