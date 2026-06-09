import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useFlow, getStatus } from "@/lib/flow-store";
import { getNotes } from "@/lib/flow-types";
import { X, ZoomIn, ZoomOut, Maximize2, Search } from "lucide-react";

interface LaidOutNode {
  id: number;
  x: number;
  y: number;
  duplicate?: boolean;
  terminal?: {
    key: string;
    label: string;
    marker: string;
    code?: string;
    groupColor?: string;
  };
}
interface Edge {
  fromId: number;
  toId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  marker: string;
  label: string;
}

const NODE_W = 130;
const NODE_H = 54;
const H_GAP = 70;
const V_GAP = 54;
const VIEWPORT_OVERSCAN = 420;

function computeLayout(
  flow: ReturnType<typeof useFlow.getState>["flow"],
  rootId: number
) {
  const nodes: LaidOutNode[] = [];
  const edges: Edge[] = [];
  const depthById = new Map<number, number>();
  const levels = new Map<number, number[]>();
  const queue: number[] = [];

  if (flow.questions[rootId]) {
    depthById.set(rootId, 0);
    queue.push(rootId);
  }

  while (queue.length) {
    const id = queue.shift()!;
    const depth = depthById.get(id) ?? 0;
    const q = flow.questions[id];
    if (!q) continue;

    q.answers.forEach((answer) => {
      if (typeof answer.target !== "number" || !flow.questions[answer.target]) return;
      if (depthById.has(answer.target)) return;
      depthById.set(answer.target, depth + 1);
      queue.push(answer.target);
    });
  }

  const reachableIds = new Set(depthById.keys());

  Object.keys(flow.questions)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((id) => {
      if (!depthById.has(id)) depthById.set(id, depthById.size + 1);
      const depth = depthById.get(id)!;
      const ids = levels.get(depth) ?? [];
      ids.push(id);
      levels.set(depth, ids);
    });

  for (const [depth, ids] of levels) {
    ids.forEach((id, index) => {
      nodes.push({
        id,
        x: 24 + index * (NODE_W + H_GAP),
        y: 24 + depth * (NODE_H + V_GAP),
        duplicate: !reachableIds.has(id),
      });
    });
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  Object.values(flow.questions).forEach((q) => {
    const from = nodeById.get(q.id);
    if (!from) return;

    q.answers.forEach((answer) => {
      if (typeof answer.target !== "number") return;
      const to = nodeById.get(answer.target);
      if (!to) return;
      edges.push({
        fromId: q.id,
        toId: answer.target,
        fromX: from.x + NODE_W / 2,
        fromY: from.y + NODE_H,
        toX: to.x + NODE_W / 2,
        toY: to.y,
        marker: answer.marker,
        label: answer.text,
      });
    });
  });

  const width = Math.max(...nodes.map((n) => n.x + NODE_W), NODE_W) + 48;
  const height = Math.max(...nodes.map((n) => n.y + NODE_H), NODE_H) + 48;

  return { nodes, edges, width, height };
}

function markerColor(m: string) {
  switch (m) {
    case "positive":
      return "#00A859";
    case "negative":
      return "#C0392B";
    case "warning":
      return "#FFCD07";
    default:
      return "#9CA3AF";
  }
}

export function TreeView({
  rootId,
  currentId,
  onSelect,
  onClose,
  inline = false,
}: {
  rootId: number;
  currentId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
  inline?: boolean;
}) {
  const flow = useFlow((s) => s.flow);
  const [zoom, setZoom] = useState(0.7);
  const [search, setSearch] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [viewportSize, setViewportSize] = useState({ width: 1, height: 1 });
  const panningRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const layout = useMemo(() => computeLayout(flow, rootId), [flow, rootId]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const updateSize = () => {
      setViewportSize({ width: el.clientWidth || 1, height: el.clientHeight || 1 });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // center current node on open
  useEffect(() => {
    const target = layout.nodes.find((n) => n.id === currentId);
    const el = viewportRef.current;
    if (target && el) {
      setPan({
        x: el.clientWidth / 2 - (target.x + NODE_W / 2) * zoom,
        y: el.clientHeight / 2 - (target.y + NODE_H / 2) * zoom,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => {
        const nz = Math.min(2, Math.max(0.15, z * (1 + delta)));
        const ratio = nz / z;
        setPan((p) => ({
          x: mx - (mx - p.x) * ratio,
          y: my - (my - p.y) * ratio,
        }));
        return nz;
      });
    },
    []
  );

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-node]")) return;
    panningRef.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    setIsPanning(true);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const p = panningRef.current;
    if (!p) return;
    setPan({ x: p.px + (e.clientX - p.x), y: p.py + (e.clientY - p.y) });
  };
  const endPan = () => {
    panningRef.current = null;
    setIsPanning(false);
  };

  const resetView = () => {
    const el = viewportRef.current;
    const target = layout.nodes.find((n) => n.id === currentId);
    if (!el) return;
    const z = 0.7;
    setZoom(z);
    if (target) {
      setPan({
        x: el.clientWidth / 2 - (target.x + NODE_W / 2) * z,
        y: el.clientHeight / 2 - (target.y + NODE_H / 2) * z,
      });
    } else {
      setPan({ x: 40, y: 40 });
    }
  };

  // attach non-passive wheel listener so preventDefault works
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => {
        const nz = Math.min(2, Math.max(0.15, z * (1 + delta)));
        const ratio = nz / z;
        setPan((p) => ({
          x: mx - (mx - p.x) * ratio,
          y: my - (my - p.y) * ratio,
        }));
        return nz;
      });
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const matches = useMemo(() => {
    if (!search.trim()) return new Set<number>();
    const term = search.toLowerCase();
    const m = new Set<number>();
    for (const n of layout.nodes) {
      const q = flow.questions[n.id];
      if (!q) continue;
      if (
        String(n.id).includes(term) ||
        q.title.toLowerCase().includes(term)
      )
        m.add(n.id);
    }
    return m;
  }, [search, layout, flow]);

  const visibleBounds = useMemo(() => {
    const left = -pan.x / zoom - VIEWPORT_OVERSCAN;
    const top = -pan.y / zoom - VIEWPORT_OVERSCAN;
    const right = (viewportSize.width - pan.x) / zoom + VIEWPORT_OVERSCAN;
    const bottom = (viewportSize.height - pan.y) / zoom + VIEWPORT_OVERSCAN;
    return { left, top, right, bottom };
  }, [pan, zoom, viewportSize]);

  const visibleNodes = useMemo(
    () =>
      layout.nodes.filter(
        (n) =>
          n.x + NODE_W >= visibleBounds.left &&
          n.x <= visibleBounds.right &&
          n.y + NODE_H >= visibleBounds.top &&
          n.y <= visibleBounds.bottom
      ),
    [layout.nodes, visibleBounds]
  );

  const visibleEdges = useMemo(
    () =>
      layout.edges.filter((e) => {
        const minX = Math.min(e.fromX, e.toX);
        const maxX = Math.max(e.fromX, e.toX);
        const minY = Math.min(e.fromY, e.toY);
        const maxY = Math.max(e.fromY, e.toY);
        return (
          maxX >= visibleBounds.left &&
          minX <= visibleBounds.right &&
          maxY >= visibleBounds.top &&
          minY <= visibleBounds.bottom
        );
      }),
    [layout.edges, visibleBounds]
  );

  // Aggregate group ids per question id from incoming answers (groups now live on answers)
  const groupsByNode = useMemo(() => {
    const map: Record<number, Set<string>> = {};
    Object.values(flow.questions).forEach((q) => {
      q.answers.forEach((a) => {
        if (typeof a.target === "number" && a.groupIds && a.groupIds.length) {
          const t = a.target;
          if (!map[t]) map[t] = new Set<string>();
          a.groupIds.forEach((gid) => map[t].add(gid));
        }
      });
    });
    return map;
  }, [flow]);

  const [notePopup, setNotePopup] = useState<{ id: number; sx: number; sy: number } | null>(null);

  return (
    <div
      className={
        inline
          ? "flex flex-col rounded border border-border bg-card overflow-hidden h-[78vh] min-h-[600px]"
          : "fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur"
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div>
          <div className="text-base font-semibold text-foreground">
            Visualização em árvore
          </div>
          <div className="text-xs text-muted-foreground">
            Rede completa do fluxo · {Object.keys(flow.questions).length} perguntas · arraste para mover · use o scroll para dar zoom · clique numa pergunta para abrir
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Localizar por ID ou título"
              className="w-64 rounded-full border border-input bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-ring"
            />
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary"
          >
            <X className="h-3.5 w-3.5" /> Fechar
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-b border-border bg-secondary/40 px-6 py-2 text-[11px] text-muted-foreground">
        <LegendDot color="#1351B4" label="Pergunta" />
        <LegendDot color="#0B2A5B" label="Selecionada (atual)" />
        <LegendDot color="#FFCD07" label="Resultado da busca" outline />
        <LegendDot color="#C0392B" label="Órfã" />
        <LegendDot color="#6B7280" label="Final" />
      </div>

      {/* Canvas */}
      <div
        ref={viewportRef}
        className="relative flex-1 overflow-hidden bg-secondary/30 select-none"
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          width={viewportSize.width}
          height={viewportSize.height}
          viewBox={`0 0 ${viewportSize.width} ${viewportSize.height}`}
          style={{ display: "block" }}
        >
          <g
            transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}
            style={{ willChange: "transform" }}
          >
            {visibleEdges.map((e, i) => {
              const midY = (e.fromY + e.toY) / 2;
              const path = `M ${e.fromX} ${e.fromY} L ${e.fromX} ${midY} L ${e.toX} ${midY} L ${e.toX} ${e.toY}`;
              const color = markerColor(e.marker);
              const label = (e.label || "").slice(0, 28);
              const labelW = Math.max(40, label.length * 5.5 + 12);
              const labelX = e.toX - labelW / 2;
              const labelY = midY + 4;
              return (
                <g key={i}>
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.2}
                    opacity={0.7}
                  />
                  {label && (
                    <g transform={`translate(${labelX}, ${labelY - 9})`}>
                      <rect
                        width={labelW}
                        height={14}
                        rx={7}
                        fill="#FFFFFF"
                        stroke={color}
                        strokeWidth={1}
                      />
                      <text
                        x={labelW / 2}
                        y={10}
                        textAnchor="middle"
                        fontFamily="Raleway, sans-serif"
                        fontSize={9}
                        fontWeight={600}
                        fill="#1F2937"
                      >
                        {label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            {visibleNodes.map((n, idx) => {
              if (n.terminal) {
                const tcolor = markerColor(n.terminal.marker);
                const isGroup = !!n.terminal.groupColor;
                const fillBg = isGroup ? `${n.terminal.groupColor}1A` : "#FFFFFF";
                const strokeC = isGroup ? n.terminal.groupColor! : tcolor;
                return (
                  <g
                    key={`t-${n.terminal.key}-${idx}`}
                    transform={`translate(${n.x}, ${n.y})`}
                  >
                    <rect
                      width={NODE_W}
                      height={NODE_H}
                      rx={NODE_H / 2}
                      fill={fillBg}
                      stroke={strokeC}
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                    <circle cx={14} cy={NODE_H / 2} r={5} fill={strokeC} />
                    <text
                      x={26}
                      y={NODE_H / 2 - 4}
                      fontFamily="Raleway, sans-serif"
                      fontSize={10}
                      fontWeight={700}
                      fill={strokeC}
                    >
                      {isGroup ? "GRUPO" : "ENCERRA"}
                    </text>
                    <text
                      x={26}
                      y={NODE_H / 2 + 10}
                      fontFamily="Raleway, sans-serif"
                      fontSize={10}
                      fill="#1F2937"
                    >
                      {n.terminal.label.slice(0, 16)}
                    </text>
                  </g>
                );
              }
              const q = flow.questions[n.id];
              const status = q ? getStatus(flow, n.id) : "orphan";
              const isCurrent = n.id === currentId;
              const isMatch = matches.has(n.id);
              const qNotes = getNotes(q);
              const aNotes = (q?.answers ?? []).flatMap((a) => getNotes(a));
              const hasNote = qNotes.length + aNotes.length > 0;
              const groupIds = Array.from(groupsByNode[n.id] ?? []);
              const groupColors = (flow.groups ?? [])
                .filter((g) => groupIds.includes(g.id))
                .map((g) => g.color);
              const fill = isCurrent
                ? "#0B2A5B"
                : status === "orphan"
                  ? "#FDECEA"
                  : status === "final"
                    ? "#F3F4F6"
                    : "#FFFFFF";
              const stroke = isMatch
                ? "#FFCD07"
                : isCurrent
                  ? "#0B2A5B"
                  : status === "orphan"
                    ? "#C0392B"
                    : status === "final"
                      ? "#9CA3AF"
                      : "#1351B4";
              const textColor = isCurrent ? "#FFFFFF" : "#1F2937";
              return (
                <g
                  key={`${n.id}-${idx}`}
                  data-node="1"
                  transform={`translate(${n.x}, ${n.y})`}
                  style={{ cursor: q ? "pointer" : "not-allowed" }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (q) onSelect(n.id);
                  }}
                >
                  <rect
                    width={NODE_W}
                    height={NODE_H}
                    rx={4}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isMatch || isCurrent ? 2.5 : 1}
                    opacity={n.duplicate ? 0.55 : 1}
                  />
                  {/* Group color band (left edge) */}
                  {groupColors.length > 0 && (
                    <g>
                      {groupColors.slice(0, 3).map((c, gi) => (
                        <rect
                          key={gi}
                          x={0}
                          y={gi * (NODE_H / Math.min(3, groupColors.length))}
                          width={3}
                          height={NODE_H / Math.min(3, groupColors.length)}
                          fill={c}
                        />
                      ))}
                    </g>
                  )}
                  {/* Note indicator */}
                  {hasNote && (
                    <g
                      transform={`translate(${NODE_W - 18}, 4)`}
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const vp = viewportRef.current?.getBoundingClientRect();
                        const ev = e as unknown as React.MouseEvent;
                        setNotePopup({
                          id: n.id,
                          sx: ev.clientX - (vp?.left ?? 0) + 8,
                          sy: ev.clientY - (vp?.top ?? 0) + 8,
                        });
                      }}
                    >
                      <rect width={14} height={14} rx={3} fill="#FFCD07" stroke="#1F2937" strokeWidth={0.6} />
                      <text x={7} y={10.5} textAnchor="middle" fontSize={9} fontWeight={700} fill="#1F2937">
                        📝
                      </text>
                    </g>
                  )}
                  <text
                    x={8}
                    y={16}
                    fontFamily="Raleway, sans-serif"
                    fontSize={10}
                    fontWeight={700}
                    fill={isCurrent ? "#FFCD07" : "#1351B4"}
                  >
                    #{n.id}
                    {n.duplicate ? " ↺" : ""}
                  </text>
                  <text
                    x={8}
                    y={32}
                    fontFamily="Raleway, sans-serif"
                    fontSize={10}
                    fill={textColor}
                  >
                    {(q?.title || "—").slice(0, 22)}
                  </text>
                  <text
                    x={8}
                    y={46}
                    fontFamily="Raleway, sans-serif"
                    fontSize={9}
                    fill={isCurrent ? "#E6EEFB" : "#6B7280"}
                  >
                    {q ? `${q.answers.length} resp.` : "ref."}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Notes popover (positioned in viewport coords, outside scaled canvas) */}
        {notePopup && (() => {
          const q = flow.questions[notePopup.id];
          if (!q) return null;
          const qns = getNotes(q);
          const answerNotes = q.answers
            .map((a) => ({ a, notes: getNotes(a) }))
            .filter((x) => x.notes.length > 0);
          return (
            <div
              style={{
                position: "absolute",
                left: Math.min(notePopup.sx, (viewportRef.current?.clientWidth ?? 800) - 296),
                top: Math.min(notePopup.sy, (viewportRef.current?.clientHeight ?? 600) - 280),
                width: 280,
                zIndex: 50,
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="border border-border bg-card shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-border bg-secondary/60 px-2 py-1 text-[11px] font-semibold">
                <span>Notas de #{q.id}</span>
                <button onClick={() => setNotePopup(null)} className="p-0.5 hover:bg-background">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <div className="max-h-64 space-y-2 overflow-auto p-2 text-[11px]">
                {qns.length === 0 && answerNotes.length === 0 && (
                  <p className="text-muted-foreground">Sem notas.</p>
                )}
                {qns.map((nt, i) => (
                  <div key={`q-${i}`} className="border-l-2 border-primary/60 bg-secondary/30 p-1.5">
                    <div className="mb-0.5 text-[9px] uppercase text-muted-foreground">
                      Pergunta · {nt.visibility === "internal" ? "Interna" : nt.visibility === "external" ? "Externa" : "Ambas"}
                    </div>
                    <p className="whitespace-pre-wrap text-foreground">
                      {nt.text || <span className="italic text-muted-foreground">(vazia)</span>}
                    </p>
                  </div>
                ))}
                {answerNotes.map(({ a, notes }) =>
                  notes.map((nt, i) => (
                    <div key={`a-${a.id}-${i}`} className="border-l-2 border-amber-400 bg-amber-50/60 p-1.5">
                      <div className="mb-0.5 text-[9px] uppercase text-muted-foreground">
                        Resposta "{a.text.slice(0, 20)}" · {nt.visibility === "internal" ? "Interna" : nt.visibility === "external" ? "Externa" : "Ambas"}
                      </div>
                      <p className="whitespace-pre-wrap text-foreground">
                        {nt.text || <span className="italic text-muted-foreground">(vazia)</span>}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* Floating controls inside the canvas */}
        <div className="pointer-events-auto absolute bottom-4 right-4 flex items-center gap-1 rounded-full border border-border bg-card/95 px-1.5 py-1 shadow-sm backdrop-blur">
          <button
            onClick={() => setZoom((z) => Math.max(0.15, z - 0.1))}
            className="rounded-full p-1.5 text-primary hover:bg-secondary"
            aria-label="diminuir zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3rem] px-1 text-center text-xs font-mono text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
            className="rounded-full p-1.5 text-primary hover:bg-secondary"
            aria-label="aumentar zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={resetView}
            className="rounded-full p-1.5 text-primary hover:bg-secondary"
            aria-label="centralizar na pergunta atual"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-border bg-card/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm">
          Arraste para mover · Scroll para zoom · renderizando {visibleNodes.length}/{layout.nodes.length}
        </div>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  outline,
}: {
  color: string;
  label: string;
  outline?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded"
        style={
          outline
            ? { border: `2px solid ${color}`, backgroundColor: "#FFFFFF" }
            : { backgroundColor: color }
        }
      />
      {label}
    </span>
  );
}
