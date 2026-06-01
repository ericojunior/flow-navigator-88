import { useState, useRef, useEffect } from "react";
import { useFlow } from "@/lib/flow-store";
import { Home, ChevronRight } from "lucide-react";

export function FlowBreadcrumb({
  path,
  onJump,
}: {
  path: number[];
  onJump: (idx: number) => void;
}) {
  const flow = useFlow((s) => s.flow);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const compact = path.length > 4;
  const visible = compact ? [path[0], ...path.slice(-2)] : path;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Caminho">
      <Home className="h-3.5 w-3.5" />
      <span>Início</span>
      {visible.map((id, i) => {
        const realIdx = compact && i > 0 ? path.length - (visible.length - i) : i;
        const isCollapseGap = compact && i === 1;
        return (
          <span key={`${id}-${i}`} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3" />
            {isCollapseGap && (
              <div ref={ref} className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="px-1 font-mono hover:text-foreground"
                >
                  ...
                </button>
                {open && (
                  <div className="absolute left-0 top-full z-20 mt-1 w-72 border border-border bg-popover p-1 shadow-md">
                    {path.map((pid, pi) => {
                      const q = flow.questions[pid];
                      return (
                        <button
                          key={pi}
                          onClick={() => {
                            onJump(pi);
                            setOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-secondary"
                        >
                          <span className="font-mono text-primary">#{pid}</span>
                          <span className="truncate text-foreground">{q?.title ?? "—"}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => onJump(realIdx)}
              className="font-mono hover:text-foreground"
            >
              #{id}
            </button>
          </span>
        );
      })}
    </nav>
  );
}