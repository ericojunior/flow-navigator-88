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
  History,
  Sparkles,
  Map,
  Menu,
  Home,
  ChevronDown,
  Accessibility,
  Contrast,
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
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <GovBrTopBar />
      <AppTitleBar />
      <SectionTabs />
      <ModuleNav />

      <div className="mx-auto w-full max-w-[1400px] px-6 pt-4">
        <PageBreadcrumb />
      </div>

      {/* Title block */}
      <div className="bg-secondary/60 border-y border-border">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
          <h1 className="text-2xl font-normal text-foreground">Editor de Redes de Perguntas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Versão de trabalho: <span className="text-foreground">{flow.version}</span>
            <span className="mx-2 text-border">|</span>
            Total de perguntas: <span className="text-foreground">{Object.keys(flow.questions).length}</span>
          </p>
        </div>
      </div>

      {/* Action toolbar */}
      <div className="mx-auto w-full max-w-[1400px] px-6 pt-6">
        <div className="flex flex-wrap items-center justify-end gap-3">
          <ToolbarPill onClick={() => setSimOpen(true)} icon={<PlayCircle className="h-3.5 w-3.5" />} label="Simular" />
          <ToolbarPill onClick={handleValidate} icon={<CheckCircle2 className="h-3.5 w-3.5" />} label="Validar" />
          <ToolbarPill onClick={renumberByFlow} icon={<ListOrdered className="h-3.5 w-3.5" />} label="Renumerar" />
          <ToolbarPill onClick={handleSave} icon={<Save className="h-3.5 w-3.5" />} label="Salvar" />
          <ToolbarPill onClick={() => generateLargeFlow(1000)} icon={<Sparkles className="h-3.5 w-3.5" />} label="Teste 1.000" />
          <button
            onClick={() => {
              const id = addQuestion();
              navigateTo(id);
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nova pergunta
          </button>
        </div>

        {validationMsg && (
          <div className="mt-4 rounded border border-border bg-card px-4 py-2 text-xs text-foreground">
            {validationMsg}
          </div>
        )}
      </div>

      {/* Three column working area */}
      <div className="mx-auto w-full max-w-[1400px] px-6 py-6 flex-1">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <FlowSidebar currentId={currentId} onSelect={navigateTo} />
          </div>

          <div className="col-span-6 flex flex-col">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-normal text-foreground">Trilho do fluxo</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Visualize a pergunta atual, sua origem e os próximos destinos.
                </p>
              </div>
              {path.length > 1 && (
                <button
                  onClick={() => jumpInPath(path.length - 2)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao pai
                </button>
              )}
            </div>

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
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary"
                >
                  <Command className="h-3 w-3" /> Ir para pergunta
                </button>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Fluxo {Math.max(1, path.length - railOffset - 2)}–{path.length - railOffset} de {path.length}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                      const idx = path.indexOf(qid);
                      if (idx >= 0) jumpInPath(idx);
                    }}
                    onNavigate={navigateTo}
                  />
                );
              })}
            </div>

            {/* History + minimap */}
            <div className="mt-4 rounded border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    <History className="h-3 w-3" /> Histórico do caminho
                  </div>
                  <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {path.map((id, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <button
                          onClick={() => jumpInPath(i)}
                          className={`font-mono ${
                            i === path.length - 1 ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {id}
                        </button>
                        <span className="max-w-[160px] truncate text-foreground/80">
                          {flow.questions[id]?.title}
                        </span>
                        {i < path.length - 1 && <span className="text-muted-foreground">›</span>}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Mini mapa</div>
                  <button
                    onClick={() => setShowMap((v) => !v)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="alternar mapa"
                  >
                    <Map className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {showMap && (
                <div className="mt-2">
                  <MiniMap currentId={currentId} />
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="col-span-3">
            <div className="rounded border border-border bg-card">
              <div className="flex border-b border-border">
                <TabButton
                  active={rightTab === "properties"}
                  onClick={() => setRightTab("properties")}
                  label="Propriedades"
                />
                <TabButton
                  active={rightTab === "diagnostics"}
                  onClick={() => setRightTab("diagnostics")}
                  label="Diagnóstico"
                />
              </div>
              <div>
                {rightTab === "properties" ? (
                  <PropertiesPanel questionId={currentId} />
                ) : (
                  <DiagnosticPanel onSelect={navigateTo} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={navigateTo} />
      {simOpen && <Simulator onClose={() => setSimOpen(false)} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-sm ${
        active
          ? "border-b-2 border-primary bg-card font-semibold text-primary"
          : "border-b-2 border-transparent text-muted-foreground hover:bg-secondary"
      }`}
    >
      {label}
    </button>
  );
}

function ToolbarPill({
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
      className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-card px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
    >
      {icon}
      {label}
    </button>
  );
}

/* ----------- Gov.br institutional chrome ----------- */

function GovBrLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-base" : "text-2xl";
  return (
    <span className={`${cls} font-extrabold tracking-tight leading-none`}>
      <span style={{ color: "#1351B4" }}>gov</span>
      <span style={{ color: "#FFCD07" }}>.</span>
      <span style={{ color: "#168821" }}>br</span>
    </span>
  );
}

function GovBrTopBar() {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <GovBrLogo />
          <span className="text-base text-foreground">Ministério da Saúde</span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-5 text-sm font-medium text-primary md:flex">
            <a className="hover:underline" href="#">Órgãos do Governo</a>
            <a className="hover:underline" href="#">Acesso à Informação</a>
            <a className="hover:underline" href="#">Legislação</a>
            <a className="hover:underline" href="#">Acessibilidade</a>
          </nav>
          <div className="flex items-center gap-2 text-primary">
            <button aria-label="Acessibilidade" className="rounded-full border border-primary p-1.5 hover:bg-primary/10">
              <Accessibility className="h-3.5 w-3.5" />
            </button>
            <button aria-label="Contraste" className="rounded-full border border-primary p-1.5 hover:bg-primary/10">
              <Contrast className="h-3.5 w-3.5" />
            </button>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-3 text-sm text-foreground hover:bg-secondary">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-primary font-semibold">
              E
            </span>
            <span>Olá, <span className="font-semibold">ERICO</span></span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AppTitleBar() {
  return (
    <div className="bg-card">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 px-6 py-3">
        <button className="text-primary" aria-label="menu">
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">SIF - Sistema Integrado de Fiscalização</h1>
          <div className="text-xs text-muted-foreground">Agência Nacional de Saúde Suplementar</div>
        </div>
      </div>
    </div>
  );
}

function SectionTabs() {
  return (
    <div className="bg-card">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-center gap-10 px-6 pb-2">
        <button className="border-b-2 border-primary px-2 py-2 text-sm font-semibold text-primary">GAMAF</button>
        <button className="border-b-2 border-transparent px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">NUCLEO-SP</button>
      </div>
    </div>
  );
}

function ModuleNav() {
  const items = [
    "Adm Documento",
    "Adm Função",
    "Adm IA",
    "Adm Objeto",
    "Adm RPR",
    "Adm Usuário",
    "Formulário Eletrônico",
    "Relatório",
    "Sistema",
  ];
  const active = "Adm RPR";
  return (
    <div className="bg-card border-b border-border">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-2 px-6 py-3">
        <button className="shrink-0 rounded-full border border-primary p-1.5 text-primary hover:bg-primary/10" aria-label="anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
          {items.map((it) => {
            const isActive = it === active;
            return (
              <button
                key={it}
                className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-primary hover:bg-secondary/80"
                }`}
                style={!isActive ? { backgroundColor: "#E6EEFB" } : undefined}
              >
                {it}
              </button>
            );
          })}
        </div>
        <button className="shrink-0 rounded-full border border-primary p-1.5 text-primary hover:bg-primary/10" aria-label="próximo">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PageBreadcrumb() {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="trilha">
      <Home className="h-4 w-4 text-primary" />
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-foreground">Adm RPR</span>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-8" style={{ backgroundColor: "#0B2A5B" }}>
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-6 text-white">
        <span className="text-2xl font-extrabold tracking-tight">
          <span style={{ color: "#FFFFFF" }}>gov</span>
          <span style={{ color: "#FFCD07" }}>.</span>
          <span style={{ color: "#FFFFFF" }}>br</span>
        </span>
        <div className="flex items-center gap-3 text-right">
          <div className="text-sm font-extrabold tracking-wide">ANS</div>
          <div className="text-[10px] leading-tight text-white/80">
            Agência Nacional de
            <br />
            Saúde Suplementar
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-3 text-center text-xs text-white/70">
        ANS - Agência Nacional de Saúde Suplementar · SIF - Versão 1.0.5
      </div>
    </footer>
  );
}
