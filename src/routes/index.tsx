import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useFlow, diagnose } from "@/lib/flow-store";
import { FlowBreadcrumb } from "@/components/flow/Breadcrumb";
import { QuestionBlock } from "@/components/flow/QuestionBlock";
import { FlowSidebar } from "@/components/flow/Sidebar";
import { PropertiesPanel } from "@/components/flow/PropertiesPanel";
import { CommandPalette } from "@/components/flow/CommandPalette";
import { DiagnosticPanel } from "@/components/flow/DiagnosticPanel";
import { Simulator } from "@/components/flow/Simulator";
import { MiniMap } from "@/components/flow/MiniMap";
import {
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  CheckCircle2,
  ListOrdered,
  Save,
  Plus,
  ArrowLeft,
  Command,
  History,
  Sparkles,
  ClipboardList,
  Map,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Editor de Rede de Perguntas" },
      { name: "description", content: "Editor institucional de fluxo de perguntas com navegação em trilho, diagnóstico e simulação." },
      { property: "og:title", content: "Editor de Rede de Perguntas" },
      { property: "og:description", content: "Editor institucional de fluxo de perguntas." },
    ],
  }),
  component: EditorPage,
});

type RightTab = "properties" | "diagnostics";

function EditorPage() {
  const flow = useFlow((s) => s.flow);
  const addQuestion = useFlow((s) => s.addQuestion);
  const generateLargeFlow = useFlow((s) => s.generateLargeFlow);
  const bumpVersion = useFlow((s) => s.bumpVersion);
  const renumberByFlow = useFlow((s) => s.renumberByFlow);

  const [path, setPath] = useState<number[]>([flow.rootId]);
  const [railOffset, setRailOffset] = useState(0); // 0 = end of path; positive = look back
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("properties");
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);

  const currentId = path[path.length - 1];

  // when flow root changes (e.g. teste 1000) reset path
  useEffect(() => {
    setPath([flow.rootId]);
    setRailOffset(0);
  }, [flow.rootId]);

  // Ctrl+K
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const navigateTo = useCallback((id: number) => {
    setPath((prev) => {
      const idx = prev.indexOf(id);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, id];
    });
    setRailOffset(0);
  }, []);

  const jumpInPath = useCallback((idx: number) => {
    setPath((prev) => prev.slice(0, idx + 1));
    setRailOffset(0);
  }, []);

  // Compute rail window: 3 visible. railOffset shifts window left by 3.
  const rail = useMemo(() => {
    const end = path.length - railOffset;
    const start = Math.max(0, end - 3);
    return path.slice(start, end);
  }, [path, railOffset]);

  const canPrev = path.length - railOffset - 3 > 0;
  const canNext = railOffset > 0;

  const handleValidate = () => {
    const d = diagnose(flow);
    const total =
      d.orphans.length + d.noAnswers.length + d.loops.length + d.unreachable.length + d.danglingAnswers.length;
    setValidationMsg(
      total === 0
        ? "Fluxo válido. Nenhum problema encontrado."
        : `${total} problema(s) encontrado(s). Veja o painel Diagnóstico.`
    );
    if (total > 0) setRightTab("diagnostics");
    setTimeout(() => setValidationMsg(null), 4000);
  };

  const handleSave = () => {
    bumpVersion();
    setValidationMsg(`Versão ${flow.version} salva.`);
    setTimeout(() => setValidationMsg(null), 3000);
  };

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Gov.br institutional bar */}
      <GovBrBar />
      <Header
        version={flow.version}
        total={Object.keys(flow.questions).length}
        onSim={() => setSimOpen(true)}
        onValidate={handleValidate}
        onRenumber={renumberByFlow}
        onSave={handleSave}
        onNew={() => {
          const id = addQuestion();
          navigateTo(id);
        }}
        onTest1000={() => generateLargeFlow(1000)}
      />

      {validationMsg && (
        <div className="border-b border-border bg-secondary px-6 py-2 text-xs text-foreground">
          {validationMsg}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <FlowSidebar currentId={currentId} onSelect={navigateTo} />

        <main className="flex min-w-0 flex-1 flex-col">
          {/* Breadcrumb */}
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
            <FlowBreadcrumb path={path} onJump={jumpInPath} />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <button
                onClick={() => setPaletteOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 hover:bg-secondary"
              >
                <Command className="h-3 w-3" /> Ir para pergunta
                <kbd className="ml-1 border border-border px-1 text-[10px]">Ctrl K</kbd>
              </button>
            </div>
          </div>

          {/* Rail */}
          <div className="flex flex-1 flex-col overflow-auto bg-background p-6">
            <h2 className="mb-1 text-3xl font-light tracking-tight text-foreground">
              Trilho do fluxo
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Visualize a pergunta atual, sua origem e os próximos destinos.
            </p>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  disabled={!canPrev}
                  onClick={() => setRailOffset((o) => o + 3)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-40 hover:bg-secondary"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Ver anteriores
                </button>
                <button
                  disabled={!canNext}
                  onClick={() => setRailOffset((o) => Math.max(0, o - 3))}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-primary disabled:opacity-40 hover:bg-secondary"
                >
                  Ver próximos <ChevronRight className="h-3.5 w-3.5" />
                </button>
                {path.length > 1 && (
                  <button
                    onClick={() => jumpInPath(path.length - 2)}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao pai
                  </button>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Trilho {Math.max(0, path.length - railOffset - 2)}–{path.length - railOffset} de {path.length}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {rail.map((id, i) => {
                const isLastInRail = i === rail.length - 1;
                const isCurrent = isLastInRail && railOffset === 0;
                const variant: "ancestor" | "parent" | "current" = isCurrent
                  ? "current"
                  : isLastInRail
                    ? "parent"
                    : "ancestor";
                return (
                  <QuestionBlock
                    key={`${id}-${i}`}
                    questionId={id}
                    variant={variant}
                    onSelect={(qid) => {
                      // jump rail to that id
                      const idx = path.indexOf(qid);
                      if (idx >= 0) jumpInPath(idx);
                    }}
                    onNavigate={navigateTo}
                  />
                );
              })}
            </div>

            {/* History + minimap */}
            <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="border border-border bg-card p-3 lg:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                  <History className="h-3 w-3" /> Histórico do caminho
                </div>
                <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {path.map((id, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <button
                        onClick={() => jumpInPath(i)}
                        className={`font-mono ${
                          i === path.length - 1 ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        #{id}
                      </button>
                      <span className="max-w-[160px] truncate text-foreground/80">
                        {flow.questions[id]?.title}
                      </span>
                      {i < path.length - 1 && <span className="text-muted-foreground">›</span>}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setShowMap((v) => !v)}
                  className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  <Map className="h-3 w-3" /> {showMap ? "Ocultar" : "Mostrar"} mini mapa
                </button>
                {showMap && <MiniMap currentId={currentId} />}
              </div>
            </div>
          </div>
        </main>

        {/* Right column */}
        <div className="flex w-80 flex-col border-l border-border bg-card">
          <div className="flex border-b border-border">
            <TabButton
              active={rightTab === "properties"}
              onClick={() => setRightTab("properties")}
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Propriedades"
            />
            <TabButton
              active={rightTab === "diagnostics"}
              onClick={() => setRightTab("diagnostics")}
              icon={<ClipboardList className="h-3.5 w-3.5" />}
              label="Diagnóstico"
            />
          </div>
          <div className="min-h-0 flex-1">
            {rightTab === "properties" ? (
              <PropertiesPanel questionId={currentId} />
            ) : (
              <DiagnosticPanel onSelect={navigateTo} />
            )}
          </div>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={navigateTo} />
      {simOpen && <Simulator onClose={() => setSimOpen(false)} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs uppercase tracking-wide ${
        active
          ? "border-b-2 border-primary bg-card font-semibold text-primary"
          : "border-b-2 border-transparent text-muted-foreground hover:bg-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function GovBrBar() {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-6 py-2">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold tracking-tight">
          <span style={{ color: "#1351B4" }}>gov</span>
          <span style={{ color: "#FFCD07" }}>.</span>
          <span style={{ color: "#00A859" }}>br</span>
        </span>
        <span className="hidden h-4 w-px bg-border sm:block" />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Governo Federal
        </span>
      </div>
      <nav className="hidden items-center gap-5 text-xs text-primary md:flex">
        <a className="hover:underline" href="#">Órgãos do Governo</a>
        <a className="hover:underline" href="#">Acesso à Informação</a>
        <a className="hover:underline" href="#">Legislação</a>
        <a className="hover:underline" href="#">Acessibilidade</a>
      </nav>
    </div>
  );
}

interface HeaderProps {
  version: string;
  total: number;
  onSim: () => void;
  onValidate: () => void;
  onRenumber: () => void;
  onSave: () => void;
  onNew: () => void;
  onTest1000: () => void;
}

function Header({ version, total, onSim, onValidate, onRenumber, onSave, onNew, onTest1000 }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-foreground">
            Editor de Rede de Perguntas
          </h1>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Agência Nacional de Saúde Suplementar</span>
            <span className="text-border">|</span>
            <span>Versão <span className="font-mono text-foreground">{version}</span></span>
            <span className="text-border">|</span>
            <span><span className="font-mono text-foreground">{total}</span> perguntas</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <HeaderButton onClick={onSim} icon={<PlayCircle className="h-3.5 w-3.5" />} label="Simular" />
          <HeaderButton onClick={onValidate} icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Validar" />
          <HeaderButton onClick={onRenumber} icon={<ListOrdered className="h-3.5 w-3.5" />} label="Renumerar" />
          <HeaderButton onClick={onSave} icon={<Save className="h-3.5 w-3.5" />} label="Salvar" />
          <HeaderButton onClick={onTest1000} icon={<Sparkles className="h-3.5 w-3.5" />} label="Teste 1.000" />
          <button
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Nova pergunta
          </button>
        </div>
      </div>
    </header>
  );
}

function HeaderButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:bg-primary/10"
    >
      {icon}
      {label}
    </button>
  );
}
