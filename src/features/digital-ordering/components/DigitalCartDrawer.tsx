import { Copy, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import AppSheet from "@/components/shared/AppSheet";
import { formatCurrency } from "@/lib/format";
import type { CartItem } from "@/features/pdv/types/cart";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  buttonStyleFor,
  inputStyle,
  radiusToCss,
  sheetPanelStyle,
  surfaceStyle,
} from "../menu/theme/menuTheme";
import DigitalEmptyState from "./DigitalEmptyState";

interface DigitalCartDrawerProps {
  open: boolean;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  deliveryFee: number;
  discount: number;
  observation: string;
  unavailableItemIds?: string[];
  onRemoveUnavailable?: () => void;
  onClose: () => void;
  onCheckout: () => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onDuplicate: (itemId: string) => void;
  onEdit: (itemId: string) => void;
  onObservationChange: (value: string) => void;
  theme?: MenuTheme;
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
  unavailableItemIds = [],
  onRemoveUnavailable,
  onClose,
  onCheckout,
  onUpdateQuantity,
  onRemove,
  onDuplicate,
  onEdit,
  onObservationChange,
  theme = DEFAULT_MENU_THEME,
}: DigitalCartDrawerProps) {
  const unavailableSet = new Set(unavailableItemIds);
  const hasUnavailable = unavailableItemIds.length > 0;

  return (
    <AppSheet
      open={open}
      onClose={onClose}
      title={`Carrinho (${itemCount})`}
      placement="right"
      panelClassName="shadow-2xl digital-sheet-enter"
      panelStyle={sheetPanelStyle(theme)}
      footer={
        <div style={{ fontFamily: theme.fontFamily }}>
          <div className="space-y-1 text-sm" style={{ color: theme.mutedTextColor }}>
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

          <div
            className="mt-3 flex items-center justify-between rounded-xl px-3 py-3 text-lg font-bold"
            style={{
              color: theme.textColor,
              backgroundColor: theme.surfaceElevated,
              borderRadius: radiusToCss(theme.cardRadius),
            }}
          >
            <span>Total</span>
            <span className="tabular-nums" style={{ color: theme.primaryColor }}>
              {formatCurrency(total)}
            </span>
          </div>

          <button
            type="button"
            disabled={items.length === 0 || hasUnavailable}
            onClick={onCheckout}
            className="digital-focus-ring digital-motion-press mt-4 w-full py-4 font-semibold disabled:opacity-40"
            style={buttonStyleFor(theme)}
          >
            Continuar para o checkout
          </button>
          <button
            type="button"
            onClick={onClose}
            className="digital-focus-ring digital-motion-press mt-2 w-full py-3 text-sm font-medium"
            style={{
              color: theme.mutedTextColor,
              borderRadius: radiusToCss(theme.buttonRadius),
            }}
          >
            Continuar comprando
          </button>
        </div>
      }
    >
      <div className="p-5" style={{ fontFamily: theme.fontFamily }}>
        {hasUnavailable ? (
          <div
            className="mb-4 border px-4 py-3 text-sm"
            style={{
              borderRadius: radiusToCss(theme.cardRadius),
              borderColor: "color-mix(in srgb, #f59e0b 45%, transparent)",
              backgroundColor: "color-mix(in srgb, #f59e0b 12%, transparent)",
              color: theme.textColor,
            }}
          >
            <p className="font-semibold">Itens indisponíveis neste canal</p>
            <p className="mt-1 text-xs opacity-80">
              Remova os itens destacados para continuar o pedido.
            </p>
            {onRemoveUnavailable ? (
              <button
                type="button"
                onClick={onRemoveUnavailable}
                className="digital-focus-ring digital-motion-press mt-3 w-full px-3 py-2 text-xs font-semibold"
                style={{
                  borderRadius: radiusToCss(theme.buttonRadius),
                  backgroundColor: "color-mix(in srgb, #f59e0b 22%, transparent)",
                  color: theme.textColor,
                }}
              >
                Remover itens indisponíveis
              </button>
            ) : null}
          </div>
        ) : null}

        {items.length === 0 ? (
          <DigitalEmptyState
            theme={theme}
            message="Seu carrinho está vazio."
          />
        ) : (
          <ul className="space-y-4">
            {items.map((item) => {
              const unavailable = unavailableSet.has(item.id);
              return (
                <li
                  key={item.id}
                  className="border p-4"
                  style={{
                    ...surfaceStyle(theme),
                    ...(unavailable
                      ? {
                          borderColor:
                            "color-mix(in srgb, #f59e0b 50%, transparent)",
                          backgroundColor:
                            "color-mix(in srgb, #f59e0b 12%, transparent)",
                        }
                      : {}),
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className="font-semibold"
                        style={{
                          color: theme.textColor,
                          fontFamily: theme.headingFontFamily,
                        }}
                      >
                        {item.product.name}
                      </p>
                      <p className="text-sm" style={{ color: theme.mutedTextColor }}>
                        {formatCurrency(item.unitPrice)} ·{" "}
                        {item.selectedOptions.length > 0
                          ? `${item.selectedOptions.length} opções`
                          : "Simples"}
                      </p>
                      {unavailable ? (
                        <p className="mt-1 text-xs font-medium text-amber-200">
                          Indisponível no canal atual
                        </p>
                      ) : null}
                      {item.observation && (
                        <p
                          className="mt-1 text-xs"
                          style={{ color: theme.mutedTextColor }}
                        >
                          Obs: {item.observation}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold" style={{ color: theme.textColor }}>
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Diminuir quantidade de ${item.product.name}`}
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity - 1)
                        }
                        className="digital-focus-ring digital-motion-press p-2"
                        style={{
                          borderRadius: "9999px",
                          backgroundColor: theme.borderColor,
                          color: theme.textColor,
                        }}
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span
                        className="w-6 text-center"
                        style={{ color: theme.textColor }}
                        aria-live="polite"
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Aumentar quantidade de ${item.product.name}`}
                        onClick={() =>
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                        className="digital-focus-ring digital-motion-press p-2"
                        style={{
                          borderRadius: "9999px",
                          backgroundColor: theme.borderColor,
                          color: theme.textColor,
                        }}
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item.id)}
                        className="digital-focus-ring digital-motion-press rounded-full p-2"
                        style={{ color: theme.mutedTextColor }}
                        aria-label={`Editar ${item.product.name}`}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicate(item.id)}
                        className="digital-focus-ring digital-motion-press rounded-full p-2"
                        style={{ color: theme.mutedTextColor }}
                        aria-label={`Duplicar ${item.product.name}`}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        className="digital-focus-ring digital-motion-press rounded-full p-2 text-red-300"
                        aria-label={`Remover ${item.product.name}`}
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <label className="mt-6 block" htmlFor="cart-order-observation">
          <span
            className="mb-2 block text-sm"
            style={{ color: theme.mutedTextColor }}
          >
            Observações do pedido
          </span>
          <textarea
            id="cart-order-observation"
            value={observation}
            onChange={(event) => onObservationChange(event.target.value)}
            rows={3}
            className="digital-focus-ring w-full border px-4 py-3 text-sm outline-none"
            style={inputStyle(theme)}
            placeholder="Ex: sem cebola, talheres, ponto da carne..."
          />
        </label>
      </div>
    </AppSheet>
  );
}
