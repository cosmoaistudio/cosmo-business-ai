import { Copy, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import AppSheet from "@/components/shared/AppSheet";
import { formatCurrency } from "@/lib/format";
import type { CartItem } from "@/features/pdv/types/cart";

interface DigitalCartDrawerProps {
  open: boolean;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  deliveryFee: number;
  discount: number;
  observation: string;
  onClose: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onDuplicate: (itemId: string) => void;
  onEdit: (itemId: string) => void;
  onObservationChange: (value: string) => void;
}

export default function DigitalCartDrawer({
  open,
  items,
  itemCount,
  subtotal,
  total,
  deliveryFee,
  discount,
  observation,
  onClose,
  onCheckout,
  onUpdateQuantity,
  onRemove,
  onDuplicate,
  onEdit,
  onObservationChange,
}: DigitalCartDrawerProps) {
  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title={`Carrinho (${itemCount})`}
      placement="right"
      panelClassName="bg-slate-950 text-white shadow-2xl"
      footer={
        <div>
          <div className="space-y-1 text-sm text-slate-300">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-emerald-300">
                <span>Desconto</span>
                <span>- {formatCurrency(discount)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={onCheckout}
            className="mt-4 w-full rounded-2xl bg-blue-600 py-4 font-semibold disabled:opacity-40"
          >
            Ir para pagamento
          </button>
        </div>
      }
    >
      <div className="p-5">
        {items.length === 0 ? (
          <p className="text-center text-slate-400">Seu carrinho está vazio.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.product.name}</p>
                    <p className="text-sm text-slate-400">
                      {formatCurrency(item.unitPrice)} ·{" "}
                      {item.selectedOptions.length > 0
                        ? `${item.selectedOptions.length} opções`
                        : "Simples"}
                    </p>
                    {item.observation && (
                      <p className="mt-1 text-xs text-slate-500">
                        Obs: {item.observation}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="rounded-full bg-white/10 p-2"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="rounded-full bg-white/10 p-2"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(item.id)}
                      className="rounded-full p-2 text-slate-300 hover:bg-white/10"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicate(item.id)}
                      className="rounded-full p-2 text-slate-300 hover:bg-white/10"
                      title="Duplicar"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className="rounded-full p-2 text-red-300 hover:bg-red-500/10"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <label className="mt-6 block">
          <span className="mb-2 block text-sm text-slate-300">
            Observações do pedido
          </span>
          <textarea
            value={observation}
            onChange={(event) => onObservationChange(event.target.value)}
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
            placeholder="Ex: sem cebola, talheres, ponto da carne..."
          />
        </label>
      </div>
    </AppSheet>
  );
}
