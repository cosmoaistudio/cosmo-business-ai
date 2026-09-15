import { CheckCircle2, Layers, Loader2, Package, Save, Smartphone } from "lucide-react";
import type { Product } from "@/features/products/types/product";
import type { CompositionOption } from "@/features/product-composition/types/option";
import type { EngineProductNode } from "@/features/product-engine/types/productEngine.types";
import { Button } from "@/components/ui/button";
import type {
  BuilderGroupState,
  BuilderProductForm,
  BuilderRulesSummary,
  BuilderScreen,
  BuilderSize,
  SaveStatus,
} from "../types/builder";
import type { BuilderValidationState } from "../utils/builderEngineBridge";
import BuilderValidationPanel from "./BuilderValidationPanel";
import ProductEditorPanel from "./ProductEditorPanel";
import ProductPreview from "./ProductPreview";
import VisualBuilderPanel from "./VisualBuilderPanel";

interface ProductBuilderProps {
  product: Product;
  productForm: BuilderProductForm;
  sizes: BuilderSize[];
  groups: BuilderGroupState[];
  linkedGroups: BuilderGroupState[];
  previewGroups: BuilderGroupState[];
  rulesSummary: BuilderRulesSummary;
  saveStatus: SaveStatus;
  activeScreen: BuilderScreen;
  validation: BuilderValidationState | null;
  engineNode: EngineProductNode | null;
  previewSelections: Record<string, string[]>;
  expandedGroupId: string | null;
  onScreenChange: (screen: BuilderScreen) => void;
  onProductChange: (patch: Partial<BuilderProductForm>) => void;
  onPreviewSelectionsChange: (selections: Record<string, string[]>) => void;
  onAddSize: () => void;
  onUpdateSize: (sizeId: string, patch: Partial<BuilderSize>) => void;
  onRemoveSize: (sizeId: string) => void;
  onReorderSizes: (from: number, to: number) => void;
  onAddGroup: () => void;
  onDuplicateGroup: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onToggleGroup: (groupId: string) => void;
  onReorderGroups: (from: number, to: number) => void;
  onUpdateGroup: (groupId: string, patch: Partial<BuilderGroupState["group"]>) => void;
  onUpdateOption: (
    groupId: string,
    optionId: string,
    patch: Partial<CompositionOption>
  ) => void;
  onReorderOptions: (groupId: string, from: number, to: number) => void;
  onExpandGroup: (groupId: string | null) => void;
  onSaveNow: () => void;
}

const SCREENS: Array<{
  id: BuilderScreen;
  label: string;
  icon: typeof Package;
}> = [
  { id: "editor", label: "Editor", icon: Package },
  { id: "builder", label: "Construtor", icon: Layers },
  { id: "preview", label: "Preview", icon: Smartphone },
];

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const labels: Record<SaveStatus, string> = {
    idle: "",
    pending: "Alterações pendentes...",
    saving: "Salvando...",
    saved: "Salvo automaticamente",
    error: "Erro ao salvar",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        status === "error"
          ? "bg-red-100 text-red-700"
          : status === "saved"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      {status === "saving" ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === "saved" ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : null}
      {labels[status]}
    </div>
  );
}

export default function ProductBuilder({
  product,
  productForm,
  sizes,
  groups,
  linkedGroups,
  previewGroups,
  rulesSummary,
  saveStatus,
  activeScreen,
  validation,
  engineNode,
  previewSelections,
  expandedGroupId,
  onScreenChange,
  onProductChange,
  onPreviewSelectionsChange,
  onAddSize,
  onUpdateSize,
  onRemoveSize,
  onReorderSizes,
  onAddGroup,
  onDuplicateGroup,
  onRemoveGroup,
  onToggleGroup,
  onReorderGroups,
  onUpdateGroup,
  onUpdateOption,
  onReorderOptions,
  onExpandGroup,
  onSaveNow,
}: ProductBuilderProps) {
  const previewProduct: Product = {
    ...product,
    name: productForm.name,
    description: productForm.description,
    price: sizes.length > 0 ? 0 : Number(productForm.price) || 0,
    status: productForm.status as Product["status"],
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1">
          {SCREENS.map((screen) => {
            const Icon = screen.icon;
            return (
              <button
                key={screen.id}
                type="button"
                onClick={() => onScreenChange(screen.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeScreen === screen.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon size={16} />
                {screen.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <SaveIndicator status={saveStatus} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={onSaveNow}
          >
            <Save size={14} />
            Salvar agora
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {activeScreen === "editor" && (
            <ProductEditorPanel
              product={product}
              productForm={productForm}
              sizes={sizes}
              productErrors={validation?.productErrors}
              onProductChange={onProductChange}
              onAddSize={onAddSize}
              onUpdateSize={onUpdateSize}
              onRemoveSize={onRemoveSize}
              onReorderSizes={onReorderSizes}
            />
          )}

          {activeScreen === "builder" && (
            <VisualBuilderPanel
              groups={groups}
              linkedGroups={linkedGroups}
              expandedGroupId={expandedGroupId}
              groupErrors={validation?.groupErrors}
              onAddGroup={onAddGroup}
              onDuplicateGroup={onDuplicateGroup}
              onRemoveGroup={onRemoveGroup}
              onToggleGroup={onToggleGroup}
              onReorderGroups={onReorderGroups}
              onUpdateGroup={onUpdateGroup}
              onUpdateOption={onUpdateOption}
              onReorderOptions={onReorderOptions}
              onExpandGroup={onExpandGroup}
            />
          )}

          {activeScreen === "preview" && (
            <div className="space-y-4 xl:hidden">
              <ProductPreview
                product={previewProduct}
                linkedGroups={previewGroups}
                engineNode={engineNode}
                previewSelections={previewSelections}
                onPreviewSelectionsChange={onPreviewSelectionsChange}
              />
            </div>
          )}

          <BuilderValidationPanel validation={validation} />

          <section className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Product Engine
            </p>
            <h2 className="mt-1 text-xl font-bold">Resumo da composição</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Grupos</p>
                <p className="mt-1 text-2xl font-bold">{rulesSummary.totalGroups}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Obrigatórios</p>
                <p className="mt-1 text-2xl font-bold">
                  {rulesSummary.requiredGroups}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Premium</p>
                <p className="mt-1 text-2xl font-bold">
                  {rulesSummary.premiumGroups}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Opções</p>
                <p className="mt-1 text-2xl font-bold">
                  {rulesSummary.totalOptions}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Pausadas</p>
                <p className="mt-1 text-2xl font-bold">
                  {rulesSummary.pausedOptions}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className={activeScreen === "preview" ? "block" : "hidden xl:block"}>
          <ProductPreview
            product={previewProduct}
            linkedGroups={previewGroups}
            engineNode={engineNode}
            previewSelections={previewSelections}
            onPreviewSelectionsChange={onPreviewSelectionsChange}
          />
        </div>
      </div>
    </div>
  );
}
