import { useEffect, useMemo, useRef, useState } from "react";
import AppModal from "@/components/shared/AppModal";
import {
  ComboComponentsEditor,
  useProductOptionsEditor,
} from "@/features/product-composition";
import { productsService } from "../services/products.service";
import type { Product } from "../types/product";
import type { CreateProductIntent } from "./ProductCreateTypeDialog";
import ProductForm from "./ProductForm";
import ProductOptionsTab from "./ProductOptionsTab";

interface ProductModalProps {
  product?: Product;
  createIntent?: CreateProductIntent;
  initialTab?: "data" | "options" | "components";
  /** Free-text categories already used in the organization catalog. */
  categorySuggestions?: string[];
  onClose: () => void;
  onSaved: (productId?: string) => void;
  onAddonChanged?: () => void;
}

type ProductModalTab = "data" | "options" | "components";

export default function ProductModal({
  product,
  createIntent,
  initialTab = "data",
  categorySuggestions = [],
  onClose,
  onSaved,
  onAddonChanged,
}: ProductModalProps) {
  const [workingProduct, setWorkingProduct] = useState<Product | undefined>(
    product
  );
  const [activeTab, setActiveTab] = useState<ProductModalTab>(
    initialTab === "components" && product?.menu_kind === "combo"
      ? "components"
      : initialTab === "options"
        ? "options"
        : "data"
  );
  const [transitioning, setTransitioning] = useState(false);
  const [openedComponentsAfterCreate, setOpenedComponentsAfterCreate] =
    useState(false);

  const optionsEditor = useProductOptionsEditor(workingProduct?.id);
  const flushPendingRef = useRef(optionsEditor.flushPendingLinks);
  flushPendingRef.current = optionsEditor.flushPendingLinks;
  const hasPendingRef = useRef(optionsEditor.hasPendingLinks);
  hasPendingRef.current = optionsEditor.hasPendingLinks;

  useEffect(() => {
    setWorkingProduct(product);
  }, [product]);

  const isEditing = Boolean(workingProduct);
  const isCombo =
    createIntent === "combo" || workingProduct?.menu_kind === "combo";
  const showOptionsTab = !isCombo;
  const showComponents = activeTab === "components" && Boolean(workingProduct);
  const showOptions = activeTab === "options" && showOptionsTab;

  const linkedAddonLabels = useMemo(
    () =>
      optionsEditor.linkedGroups
        .map((link) => link.option_groups?.name?.trim())
        .filter((name): name is string => Boolean(name)),
    [optionsEditor.linkedGroups]
  );

  const compositionHint = useMemo(() => {
    if (isCombo) {
      return "Composição do combo na aba Produtos do combo.";
    }
    if (
      createIntent === "assembled" ||
      workingProduct?.menu_kind === "assembled"
    ) {
      return "Copo montado: grupos de opções personalizam o produto.";
    }
    return null;
  }, [isCombo, createIntent, workingProduct?.menu_kind]);

  const title = isEditing
    ? isCombo
      ? "Editar combo"
      : "Editar produto"
    : createIntent === "assembled"
      ? "Novo copo montado"
      : createIntent === "combo"
        ? "Novo combo"
        : "Novo produto";

  const menuKind =
    createIntent === "combo"
      ? "combo"
      : createIntent === "assembled"
        ? "assembled"
        : createIntent === "simple"
          ? "simple"
          : workingProduct?.menu_kind;

  const modalSize =
    activeTab === "components" && isCombo
      ? "2xl"
      : activeTab === "data" || !showOptions
        ? "2xl"
        : "xl";

  return (
    <AppModal title={title} onClose={onClose} size={modalSize}>
      {createIntent === "assembled" && !isEditing && (
        <p className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Cadastre o básico e, se quiser, já vincule adicionais. Após salvar,
          o Product Builder fica disponível para montagem avançada.
        </p>
      )}
      {createIntent === "combo" && !isEditing && (
        <p className="mb-4 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          Informe nome, preço, imagem e status. Em seguida você escolhe os
          produtos do combo.
        </p>
      )}
      {createIntent === "simple" && !isEditing && (
        <p className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Rápido: nome, categoria e preço bastam para salvar. Foto e adicionais
          podem ser completados em seguida.
        </p>
      )}

      {(isEditing || showOptionsTab) && (
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("data")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              activeTab === "data"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Dados
          </button>

          {showOptionsTab && (
            <button
              type="button"
              onClick={() => setActiveTab("options")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === "options"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Opções e adicionais
            </button>
          )}

          {isCombo && isEditing && (
            <button
              type="button"
              onClick={() => setActiveTab("components")}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                activeTab === "components"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Produtos do combo
            </button>
          )}
        </div>
      )}

      {transitioning ? (
        <p className="py-8 text-center text-sm text-slate-500">
          Abrindo editor do combo…
        </p>
      ) : (
        <>
          {!showComponents && (
            <div className={showOptions ? "hidden" : undefined}>
              <ProductForm
                product={workingProduct}
                menuKind={menuKind}
                categorySuggestions={categorySuggestions}
                linkedAddonLabels={linkedAddonLabels}
                compositionHint={compositionHint}
                showCompositionChecklist={
                  isCombo ||
                  createIntent === "assembled" ||
                  workingProduct?.menu_kind === "assembled"
                }
                hasComposition={
                  isCombo
                    ? false
                    : linkedAddonLabels.length > 0 ||
                      workingProduct?.menu_kind === "assembled"
                }
                onCancel={onClose}
                onSuccess={async (productId) => {
                  if (productId && hasPendingRef.current) {
                    await flushPendingRef.current(productId);
                  }

                  onSaved(productId);

                  const justCreatedCombo =
                    createIntent === "combo" &&
                    Boolean(productId) &&
                    !product &&
                    !openedComponentsAfterCreate;

                  if (justCreatedCombo && productId) {
                    try {
                      setTransitioning(true);
                      const saved = await productsService.getById(productId);
                      setWorkingProduct(saved);
                      setOpenedComponentsAfterCreate(true);
                      setActiveTab("components");
                    } catch {
                      onClose();
                    } finally {
                      setTransitioning(false);
                    }
                    return;
                  }

                  if (isCombo && productId && workingProduct) {
                    try {
                      const saved = await productsService.getById(productId);
                      setWorkingProduct(saved);
                    } catch {
                      /* keep previous */
                    }
                    return;
                  }

                  // Simple create: stay open so the user can add photo/addons now.
                  if (
                    createIntent === "simple" &&
                    productId &&
                    !product &&
                    !workingProduct
                  ) {
                    try {
                      const saved = await productsService.getById(productId);
                      setWorkingProduct(saved);
                      setActiveTab("options");
                    } catch {
                      onClose();
                    }
                    return;
                  }

                  // Assembled create → parent navigates to builder.
                  if (createIntent === "assembled" && productId && !product) {
                    onClose();
                    return;
                  }

                  onClose();
                }}
              />
            </div>
          )}

          {showOptions ? (
            <ProductOptionsTab
              productId={workingProduct?.id}
              editor={optionsEditor}
              onAddonChanged={onAddonChanged}
            />
          ) : null}

          {showComponents && workingProduct ? (
            <ComboComponentsEditor
              comboProduct={workingProduct}
              onProductUpdated={setWorkingProduct}
            />
          ) : null}
        </>
      )}
    </AppModal>
  );
}
