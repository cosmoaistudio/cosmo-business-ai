import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ProductBuilder, useProductBuilder } from "@/features/product-builder";

export default function ProductBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const builder = useProductBuilder(id);

  if (builder.loading || !builder.product || !builder.productForm) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/produtos/builder"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Voltar para lista
        </Link>
        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Product Builder Visual
        </h1>
        <p className="mt-1 text-slate-500">
          {builder.productForm.name} — Editor · Construtor · Preview em tempo real
        </p>
      </div>

      <ProductBuilder
        product={builder.product}
        productForm={builder.productForm}
        sizes={builder.sizes}
        groups={builder.groups}
        linkedGroups={builder.linkedGroups}
        previewGroups={builder.previewGroups}
        rulesSummary={builder.rulesSummary}
        saveStatus={builder.saveStatus}
        activeScreen={builder.activeScreen}
        validation={builder.validation}
        engineNode={builder.engineNode}
        previewSelections={builder.previewSelections}
        expandedGroupId={builder.expandedGroupId}
        onScreenChange={builder.setActiveScreen}
        onProductChange={builder.updateProductForm}
        onPreviewSelectionsChange={builder.updatePreviewSelections}
        onAddSize={builder.addSize}
        onUpdateSize={builder.updateSize}
        onRemoveSize={builder.removeSize}
        onReorderSizes={builder.reorderSizes}
        onAddGroup={builder.addGroup}
        onDuplicateGroup={builder.duplicateGroup}
        onRemoveGroup={builder.removeGroup}
        onToggleGroup={builder.toggleGroup}
        onReorderGroups={builder.reorderLinkedGroups}
        onUpdateGroup={builder.updateGroupConfig}
        onUpdateOption={builder.updateOption}
        onReorderOptions={builder.reorderOptions}
        onExpandGroup={builder.setExpandedGroupId}
        onSaveNow={builder.saveNow}
      />
    </div>
  );
}
