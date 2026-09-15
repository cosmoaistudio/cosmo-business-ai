import { Check, Circle } from "lucide-react";
import type { ProductChecklistItem } from "../utils/productFormChecklist";
import { summarizeProductChecklist } from "../utils/productFormChecklist";

interface ProductFormChecklistProps {
  items: ProductChecklistItem[];
}

export default function ProductFormChecklist({
  items,
}: ProductFormChecklistProps) {
  const summary = summarizeProductChecklist(items);
  const required = items.filter((item) => item.kind === "required");
  const optional = items.filter((item) => item.kind === "optional");

  return (
    <div className="product-form-checklist">
      <div className="product-form-checklist__head">
        <p className="product-form-checklist__title">Progresso do cadastro</p>
        <p className="product-form-checklist__summary">
          {summary.readyToSave
            ? "Mínimo pronto para salvar"
            : "Preencha os itens obrigatórios"}
        </p>
      </div>

      <div className="product-form-checklist__groups">
        <div>
          <p className="product-form-checklist__group-label">Obrigatório</p>
          <ul className="product-form-checklist__list">
            {required.map((item) => (
              <li
                key={item.id}
                className={
                  item.done
                    ? "product-form-checklist__item product-form-checklist__item--done"
                    : "product-form-checklist__item"
                }
              >
                {item.done ? <Check size={14} /> : <Circle size={14} />}
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="product-form-checklist__group-label">Opcional</p>
          <ul className="product-form-checklist__list">
            {optional.map((item) => (
              <li
                key={item.id}
                className={
                  item.done
                    ? "product-form-checklist__item product-form-checklist__item--done"
                    : "product-form-checklist__item"
                }
              >
                {item.done ? <Check size={14} /> : <Circle size={14} />}
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
