import { useMemo, useState, useRef, useEffect } from "react";
import { useFlow, getStatus } from "@/lib/flow-store";
import { X, ZoomIn, ZoomOut, Maximize2, Search } from "lucide-react";

interface LaidOutNode {
  id: number;
  x: number;
  y: number;
  duplicate?: boolean;
}
interface Edge {
  fromId: number;
  toId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  marker: string;
}

const NODE_W = 130;
const NODE_H = 54;
const H_GAP = 16;
const V_GAP = 60;

function computeLayout(
  flow: ReturnType<typeof useFlow.getState>["flow"],
  rootId: number
) {
  const nodes: LaidOutNode[] = [];
  const edges: Edge[] = [];
  const seen = new Set<number>();

  // returns subtree width in "slots" (multiples of NODE_W + H_GAP)
  function place(id: number, depth: number, xOffset: number): number {
    const q = flow.questions[id];
    if (!q) {
      nodes.push({ id, x: xOffset, y: depth * (NODE_H + V_GAP), duplicate: true });
      return NODE_W + H_GAP;
    }
    if (seen.has(id)) {
      // render as duplicate reference (no children)
      nodes.push({ id, x: xOffset, y: depth * (NODE_H + V_GAP), duplicate: true });
      return NODE_W + H_GAP;
    }
    seen.add(id);

    const children = q.answers
      .filter((a) => a.target !== "end" && typeof a.target === "number")
      .map((a) => ({ tid: a.target as number, marker: a.marker }));

    if (children.length === 0) {
      nodes.push({ id, x: xOffset, y: depth * (NODE_H + V_GAP) });
      return NODE_W + H_GAP;
    }

    let cursor = xOffset;
    const childCenters: number[] = [];
    for (const child of children) {
      const start = cursor;
      const w = place(child.tid, depth + 1, cursor);
      const center = start + w / 2;
      childCenters.push(center);
      cursor += w;
    }
    const totalW = cursor - xOffset;
    const myCenter = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
    const myX = myCenter - NODE_W / 2 - H_GAP / 2;
    const myY = depth * (NODE_H + V_GAP);
    nodes.push({ id, x: myX, y: myY });

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const cx = childCenters[i] - H_GAP / 2;
      edges.push({
        fromId: id,
        toId: child.tid,
        fromX: myCenter - H_GAP / 2,
        fromY: myY + NODE_H,
        toX: cx,
        toY: (depth + 1) * (NODE_H + V_GAP),
        marker: child.marker,
      });
    }
    return totalW;
  }

  const totalWidth = place(rootId, 0, 0);

  // also include disconnected questions in a separate band at the bottom
  const placed = new Set(nodes.map((n) => n.id));
  const orphans = Object.keys(flow.questions)
    .map(Number)
    .filter((id) => !placed.has(id));
  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.y), 0);
  const orphanY = maxDepth + NODE_H + V_GAP * 2;
  orphans.forEach((id, i) => {
    nodes.push({
      id,
      x: i * (NODE_W + H_GAP),
      y: orphanY,
      duplicate: false,
    });
  });

  const width = Math.max(totalWidth, orphans.length * (NODE_W + H_GAP)) + 40;
  const height = (orphans.length > 0 ? orphanY : maxDepth) + NODE_H + 40;

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
}: {
  rootId: number;
  currentId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  const flow = useFlow((s) => s.flow);
  const [zoom, setZoom] = useState(0.7);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const layout = useMemo(() => computeLayout(flow, rootId), [flow, rootId]);

  // center current node on open
  useEffect(() => {
    const t = setTimeout(() => {
      const target = layout.nodes.find((n) => n.id === currentId);
      if (target && scrollRef.current) {
        const el = scrollRef.current;
        el.scrollLeft = target.x * zoom - el.clientWidth / 2 + (NODE_W * zoom) / 2;
        el.scrollTop = target.y * zoom - el.clientHeight / 2 + (NODE_H * zoom) / 2;
      }
    }, 50);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div>
          <div className="text-base font-semibold text-foreground">
            Visualização em árvore
          </div>
          <div className="text-xs text-muted-foreground">
            Rede completa do fluxo · {Object.keys(flow.questions).length} perguntas · clique em uma
            pergunta para abri-la no editor
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
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
              className="rounded-full p-1 text-primary hover:bg-secondary"
              aria-label="diminuir zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 text-xs font-mono text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
              className="rounded-full p-1 text-primary hover:bg-secondary"
              aria-label="aumentar zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="rounded-full p-1 text-primary hover:bg-secondary"
              aria-label="redefinir zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
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
      <div ref={scrollRef} className="flex-1 overflow-auto bg-secondary/30">
        <div
          style={{
            width: layout.width * zoom,
            height: layout.height * zoom,
            position: "relative",
          }}
        >
          <svg
            width={layout.width * zoom}
            height={layout.height * zoom}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            style={{ display: "block" }}
          >
            {layout.edges.map((e, i) => {
              const midY = (e.fromY + e.toY) / 2;
              const path = `M ${e.fromX} ${e.fromY} L ${e.fromX} ${midY} L ${e.toX} ${midY} L ${e.toX} ${e.toY}`;
              return (
                <path
                  key={i}
                  d={path}
                  fill="none"
                  stroke={markerColor(e.marker)}
                  strokeWidth={1.2}
                  opacity={0.7}
                />
              );
            })}
            {layout.nodes.map((n, idx) => {
              const q = flow.questions[n.id];
              const status = q ? getStatus(flow, n.id) : "orphan";
              const isCurrent = n.id === currentId;
              const isMatch = matches.has(n.id);
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
                  transform={`translate(${n.x}, ${n.y})`}
                  style={{ cursor: q ? "pointer" : "not-allowed" }}
                  onClick={() => {
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
          </svg>
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