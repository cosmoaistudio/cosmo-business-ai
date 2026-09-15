import { ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

interface DigitalProductCardProps {
  product: DigitalMenuProduct;
  onSelect: () => void;
}

export default function DigitalProductCard({
  product,
  onSelect,
}: DigitalProductCardProps) {
  const groupCount = product.groups.length;
  const isCombo =
    product.menuKind === "combo" || (product.comboSlots?.length ?? 0) > 0;
  const slotCount = product.comboSlots?.length ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex flex-col rounded-3xl border border-white/10 bg-white/5 p-5 text-left transition hover:border-white/25 hover:bg-white/10"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
          {isCombo ? (
            <p className="mt-1 text-xs text-slate-400">
              Combo · {slotCount} componente{slotCount === 1 ? "" : "s"}
            </p>
          ) : groupCount > 0 ? (
            <p className="mt-1 text-xs text-slate-400">
              Personalizável · {groupCount} grupo{groupCount > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
        <ChevronRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5" />
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-xl font-bold text-white">
          {formatCurrency(product.basePrice)}
        </span>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium">
          Adicionar
        </span>
      </div>
    </button>
  );
}
