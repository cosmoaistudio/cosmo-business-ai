import { memo } from "react";
import type { ActionCatalogItem, TriggerCatalogItem } from "../../catalog";

interface CatalogLibraryProps {
  tab: "triggers" | "actions";
  onTabChange: (tab: "triggers" | "actions") => void;
  triggers: TriggerCatalogItem[];
  actions: ActionCatalogItem[];
  selectedTriggerKey?: string | null;
  selectedActionKeys?: string[];
  onSelectTrigger?: (triggerKey: string) => void;
  onToggleAction?: (actionKey: string) => void;
}

function availabilityBadge(availability: "live" | "planned") {
  return availability === "live"
    ? "cosmo-auto__badge cosmo-auto__badge--live"
    : "cosmo-auto__badge cosmo-auto__badge--planned";
}

function CatalogLibraryComponent({
  tab,
  onTabChange,
  triggers,
  actions,
  selectedTriggerKey,
  selectedActionKeys = [],
  onSelectTrigger,
  onToggleAction,
}: CatalogLibraryProps) {
  const items = tab === "triggers" ? triggers : actions;

  return (
    <section className="cosmo-auto__panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="cosmo-auto__title">Biblioteca</h2>
          <p className="cosmo-auto__desc">
            Catálogos separados de gatilhos e ações. Itens ao vivo já existem no
            motor; planejados são conectores futuros entre módulos.
          </p>
        </div>
        <div className="cosmo-auto__tabs" role="tablist" aria-label="Biblioteca">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "triggers"}
            className={
              tab === "triggers"
                ? "cosmo-auto__tab cosmo-auto__tab--active"
                : "cosmo-auto__tab"
            }
            onClick={() => onTabChange("triggers")}
          >
            Gatilhos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "actions"}
            className={
              tab === "actions"
                ? "cosmo-auto__tab cosmo-auto__tab--active"
                : "cosmo-auto__tab"
            }
            onClick={() => onTabChange("actions")}
          >
            Ações
          </button>
        </div>
      </div>

      <div className="cosmo-auto__grid cosmo-auto__grid--3 mt-4">
        {items.map((item) => {
          const isTrigger = tab === "triggers";
          const key = isTrigger
            ? (item as TriggerCatalogItem).triggerKey
            : (item as ActionCatalogItem).actionKey;
          const selected = isTrigger
            ? selectedTriggerKey === key
            : selectedActionKeys.includes(key);

          return (
            <button
              key={item.id}
              type="button"
              className={
                selected
                  ? "cosmo-auto__card cosmo-auto__card--selected"
                  : "cosmo-auto__card"
              }
              onClick={() => {
                if (isTrigger) onSelectTrigger?.(key);
                else onToggleAction?.(key);
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="cosmo-auto__card-title">{item.label}</span>
                <span className={availabilityBadge(item.availability)}>
                  {item.availability === "live" ? "Ao vivo" : "Planejado"}
                </span>
              </div>
              <p className="cosmo-auto__card-desc">{item.description}</p>
              {"example" in item && item.example ? (
                <p className="cosmo-auto__card-desc mt-2 italic">
                  Ex.: {item.example}
                </p>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export const CatalogLibrary = memo(CatalogLibraryComponent);
