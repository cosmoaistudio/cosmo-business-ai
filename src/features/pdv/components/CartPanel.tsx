import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Card from "@/components/shared/Card";
import { formatCurrency } from "@/lib/format";
import type { CartItem, CartSummary } from "../types/cart";
import ProductThumbnail from "./ProductThumbnail";

interface CartPanelProps {
  items: CartItem[];
  summary: CartSummary;
  discount: number;
  observation: string;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onEditItem?: (itemId: string) => void;
  onDiscountChange: (value: number) => void;
  onObservationChange: (value: string) => void;
  onCancelSale: () => void;
  onFinalizeSale: () => void;
}

export default function CartPanel({
  items,
  summary,
  discount,
  observation,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onDiscountChange,
  onObservationChange,
  onCancelSale,
  onFinalizeSale,
}: CartPanelProps) {
  return (
    <Card className="flex h-full min-h-[600px] flex-col">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900">Carrinho</h2>
        <p className="mt-1 text-sm text-slate-500">
          {summary.itemCount}{" "}
          {summary.itemCount === 1 ? "item" : "itens"}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {items.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
            Adicione produtos para iniciar a venda.
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-100 p-4"
          >
            <div className="flex gap-3">
              <ProductThumbnail product={item.product} size="sm" />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-900">
                    {item.product.name}
                  </p>

                  <div className="flex shrink-0 gap-1">
                    {onEditItem && item.selectedOptions.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEditItem(item.id)}
                        className="text-slate-400 hover:text-blue-600"
                        aria-label={`Editar ${item.product.name}`}
                      >
                        <Pencil size={14} />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Remover ${item.product.name}`}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {formatCurrency(item.unitPrice)} / un
                </p>

                {item.summaries?.customer.lines.slice(1, 4).map((line) => (
                  <p key={line} className="mt-1 text-xs text-slate-500">
                    {line}
                  </p>
                ))}

                {item.selectedOptions.length > 0 && (
                  <ul className="mt-3 space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {item.selectedOptions.map((option) => (
                      <li
                        key={option.optionId}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          {option.groupName}: {option.optionName}
                        </span>
                        {option.price > 0 && (
                          <span className="font-medium text-slate-700">
                            + {formatCurrency(option.price)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {item.observation && (
                  <p className="mt-2 text-xs italic text-slate-500">
                    Obs.: {item.observation}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    onUpdateQuantity(item.id, item.quantity - 1)
                  }
                >
                  <Minus size={14} />
                </Button>

                <span className="min-w-8 text-center font-semibold">
                  {item.quantity}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() =>
                    onUpdateQuantity(item.id, item.quantity + 1)
                  }
                  disabled={item.quantity >= item.product.stock}
                >
                  <Plus size={14} />
                </Button>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-500">Subtotal</p>
                <p className="font-bold text-slate-900">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="cart-observation"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Observação
            </label>
            <textarea
              id="cart-observation"
              value={observation}
              onChange={(event) => onObservationChange(event.target.value)}
              placeholder="Observações sobre a venda..."
              rows={2}
              disabled={items.length === 0}
              className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-500">
              <span>Desconto</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">R$</span>
                <Input
                  type="number"
                  min={0}
                  max={summary.subtotal}
                  step="0.01"
                  value={discount || ""}
                  onChange={(event) =>
                    onDiscountChange(
                      Number.parseFloat(event.target.value) || 0
                    )
                  }
                  disabled={items.length === 0}
                  className="h-8 w-24 rounded-xl text-right"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-lg font-bold text-slate-900">Total</span>
              <span className="text-2xl font-black text-blue-600">
                {formatCurrency(summary.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl text-base"
            disabled={items.length === 0}
            onClick={onCancelSale}
          >
            Cancelar venda
          </Button>

          <Button
            className="h-11 w-full rounded-xl text-base"
            disabled={items.length === 0}
            onClick={onFinalizeSale}
          >
            Finalizar venda
          </Button>
        </div>
      </div>
    </Card>
  );
}
