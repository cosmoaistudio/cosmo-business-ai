import { Package } from "lucide-react";
import { formatCurrency } from "@/lib/format";

export interface ProductLivePreviewProps {
  name: string;
  category: string;
  description: string;
  price: string | number;
  status: string;
  imageUrl?: string;
  addonLabels?: string[];
  compositionHint?: string | null;
  isCombo?: boolean;
}

export default function ProductLivePreview({
  name,
  category,
  description,
  price,
  status,
  imageUrl,
  addonLabels = [],
  compositionHint,
  isCombo = false,
}: ProductLivePreviewProps) {
  const displayName = name.trim() || (isCombo ? "Novo combo" : "Novo produto");
  const displayCategory = category.trim() || (isCombo ? "Combos" : "Sem categoria");
  const priceNumber =
    typeof price === "number" ? price : Number(String(price).replace(",", "."));
  const priceLabel =
    String(price).trim() === "" || !Number.isFinite(priceNumber)
      ? "—"
      : formatCurrency(priceNumber);
  const isActive = status !== "inactive";

  return (
    <div className="product-live-preview">
      <p className="product-live-preview__eyebrow">Preview do cliente</p>

      <div className="product-live-preview__card">
        <div className="product-live-preview__media">
          {imageUrl?.trim() ? (
            <img
              src={imageUrl}
              alt={displayName}
              className="product-live-preview__image"
            />
          ) : (
            <div className="product-live-preview__fallback" aria-hidden>
              <Package size={36} />
              <span>Sem foto</span>
            </div>
          )}
          <span
            className={`product-live-preview__status ${
              isActive
                ? "product-live-preview__status--active"
                : "product-live-preview__status--inactive"
            }`}
          >
            {isActive ? "Ativo" : "Inativo"}
          </span>
        </div>

        <div className="product-live-preview__body">
          <p className="product-live-preview__category">{displayCategory}</p>
          <h3 className="product-live-preview__name">{displayName}</h3>
          {description.trim() ? (
            <p className="product-live-preview__description">{description}</p>
          ) : (
            <p className="product-live-preview__description product-live-preview__description--muted">
              Sem descrição
            </p>
          )}
          <p className="product-live-preview__price">{priceLabel}</p>

          {addonLabels.length > 0 ? (
            <div className="product-live-preview__addons">
              <p className="product-live-preview__addons-label">Adicionais</p>
              <ul>
                {addonLabels.slice(0, 4).map((label) => (
                  <li key={label}>{label}</li>
                ))}
                {addonLabels.length > 4 ? (
                  <li>+{addonLabels.length - 4} mais</li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {compositionHint ? (
            <p className="product-live-preview__composition">{compositionHint}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
