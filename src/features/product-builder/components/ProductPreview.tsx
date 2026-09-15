import { useState } from "react";
import type { Product } from "@/features/products/types/product";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import type { BuilderGroupState } from "../types/builder";
import CompositionPreviewPanel from "./CompositionPreviewPanel";

interface ProductPreviewProps {
  product: Product;
  linkedGroups: BuilderGroupState[];
  engineNode: EngineProductNode | null;
  previewSelections: Record<string, string[]>;
  onPreviewSelectionsChange: (selections: Record<string, string[]>) => void;
}

export default function ProductPreview({
  product,
  linkedGroups,
  engineNode,
  previewSelections,
  onPreviewSelectionsChange,
}: ProductPreviewProps) {
  const [mode, setMode] = useState<"pdv" | "menu">("menu");

  return (
    <div className="sticky top-6 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
          Preview em tempo real
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Como o cliente verá
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Simulação interativa com Product Engine enquanto você edita.
        </p>
      </div>

      <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("menu")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "menu"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          Cardápio
        </button>
        <button
          type="button"
          onClick={() => setMode("pdv")}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
            mode === "pdv"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500"
          }`}
        >
          PDV (simulação)
        </button>
      </div>

      <CompositionPreviewPanel
        mode={mode}
        product={product}
        linkedGroups={linkedGroups}
        engineNode={engineNode}
        previewSelections={previewSelections}
        onPreviewSelectionsChange={onPreviewSelectionsChange}
      />
    </div>
  );
}
