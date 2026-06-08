import { useMemo, useState } from "react";
import { X, Search, Plus, Eraser } from "lucide-react";

export interface PickerItem {
  id: string;
  primary: string;
  secondary?: string;
  active: boolean;
}

/**
 * Gov.br styled list picker. Mirrors the look of pergunta/resposta/grupo
 * administration screens: search box, status filter, paginated list,
 * Limpar/Pesquisar, Cadastrar.
 */
export function PickerModal({
  title,
  primaryLabel,
  items,
  selectedId,
  searchPlaceholder = "Limite máximo de 500 caracteres",
  searchHint,
  onPick,
  onClose,
  onCreate,
  createLabel = "Cadastrar",
}: {
  title: string;
  primaryLabel: string;
  items: PickerItem[];
  selectedId?: string;
  searchPlaceholder?: string;
  searchHint?: string;
  onPick: (id: string) => void;
  onClose: () => void;
  onCreate?: (text: string) => string;
  createLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [applied, setApplied] = useState({ q: "", activeOnly: true });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [creating, setCreating] = useState(false);
  const [newText, setNewText] = useState("");

  const filtered = useMemo(() => {
    const term = applied.q.trim().toLowerCase();
    return items.filter((it) => {
      if (applied.activeOnly && !it.active) return false;
      if (!term) return true;
      return (
        it.primary.toLowerCase().includes(term) ||
        (it.secondary?.toLowerCase().includes(term) ?? false)
      );
    });
  }, [items, applied]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  const apply = () => {
    setApplied({ q: query, activeOnly });
    setPage(1);
  };
  const clear = () => {
    setQuery("");
    setActiveOnly(true);
    setApplied({ q: "", activeOnly: true });
    setPage(1);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-4xl flex-col border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
          <div className="text-base font-semibold text-primary">{title}</div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:bg-background" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="overflow-auto px-5 py-4">
          {/* Search */}
          <div className="mb-2">
            <label className="mb-1 block text-xs font-medium text-foreground">
              {primaryLabel}:
            </label>
            <div className="flex items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
                placeholder={searchPlaceholder}
                className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm italic text-muted-foreground outline-none focus:border-ring focus:not-italic focus:text-foreground"
              />
              <label className="inline-flex shrink-0 items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                Ativa
              </label>
            </div>
            {searchHint && (
              <p className="mt-1 text-[11px] text-amber-700">{searchHint}</p>
            )}
          </div>

          <div className="mb-3 flex justify-end gap-2">
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-card px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
            >
              <Eraser className="h-3 w-3" /> Limpar
            </button>
            <button
              onClick={apply}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Search className="h-3 w-3" /> Pesquisar
            </button>
          </div>

          {/* Table */}
          <div className="border border-border">
            <div className="grid grid-cols-[1fr_120px_90px] items-center bg-secondary/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-primary">
              <span>{primaryLabel.toUpperCase()}S</span>
              <span className="text-center">STATUS</span>
              <span className="text-center">AÇÕES</span>
            </div>
            <ul>
              {pageItems.length === 0 && (
                <li className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Nenhum resultado.
                </li>
              )}
              {pageItems.map((it) => {
                const isSelected = it.id === selectedId;
                return (
                  <li
                    key={it.id}
                    className={`grid grid-cols-[1fr_120px_90px] items-center border-t border-border px-4 py-2.5 text-sm ${
                      isSelected ? "bg-primary/5" : "hover:bg-secondary/30"
                    }`}
                  >
                    <span className="pr-3 text-foreground">{it.primary}</span>
                    <span className="text-center text-xs text-muted-foreground">
                      {it.active ? "Ativa" : "Inativa"}
                    </span>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => {
                          onPick(it.id);
                          onClose();
                        }}
                        className="rounded border border-primary px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        Selecionar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Exibir</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded border border-input bg-background px-1.5 py-1 text-primary"
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="ml-3">
                {filtered.length === 0
                  ? "0–0"
                  : `${start + 1}–${Math.min(start + perPage, filtered.length)}`}{" "}
                de {filtered.length} itens
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>Página</span>
              <select
                value={safePage}
                onChange={(e) => setPage(Number(e.target.value))}
                className="rounded border border-input bg-background px-1.5 py-1 text-primary"
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full border border-border px-2 py-0.5 text-primary disabled:opacity-40"
              >
                ‹
              </button>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-full border border-border px-2 py-0.5 text-primary disabled:opacity-40"
              >
                ›
              </button>
            </div>
          </div>

          {/* Create */}
          {onCreate && (
            <div className="mt-4 border-t border-border pt-3">
              {!creating ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => setCreating(true)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-3 w-3" /> {createLabel}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder={`Texto da nova ${primaryLabel.toLowerCase()}`}
                    className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newText.trim() && onCreate) {
                        const id = onCreate(newText.trim());
                        setNewText("");
                        setCreating(false);
                        onPick(id);
                        onClose();
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newText.trim() && onCreate) {
                        const id = onCreate(newText.trim());
                        setNewText("");
                        setCreating(false);
                        onPick(id);
                        onClose();
                      }
                    }}
                    className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setCreating(false);
                      setNewText("");
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}