import type { ReactNode } from "react";
import type { DigitalDeliveryAddress } from "../types/digitalOrdering.types";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  inputStyle,
  radiusToCss,
  surfaceStyle,
} from "../menu/theme/menuTheme";
import {
  EMPTY_DELIVERY_ADDRESS,
  formatCepDisplay,
  normalizeCep,
  normalizeState,
  summarizeDeliveryAddress,
  type DeliveryAddressErrors,
} from "../utils/deliveryAddress";

interface DigitalDeliveryAddressFormProps {
  value: DigitalDeliveryAddress;
  errors: DeliveryAddressErrors;
  onChange: (next: DigitalDeliveryAddress) => void;
  theme?: MenuTheme;
}

function Field({
  label,
  required,
  error,
  htmlFor,
  theme,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  htmlFor: string;
  theme: MenuTheme;
  children: ReactNode;
}) {
  return (
    <div className="block space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium"
        style={{ color: theme.mutedTextColor }}
      >
        {label}
        {required ? <span className="text-amber-300"> *</span> : null}
      </label>
      {children}
      {error ? (
        <span className="block text-xs text-amber-300" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export default function DigitalDeliveryAddressForm({
  value,
  errors,
  onChange,
  theme = DEFAULT_MENU_THEME,
}: DigitalDeliveryAddressFormProps) {
  const address = { ...EMPTY_DELIVERY_ADDRESS, ...value };

  const patch = (partial: Partial<DigitalDeliveryAddress>) => {
    onChange({ ...address, ...partial });
  };

  const fieldInput = (invalid?: boolean) =>
    `digital-focus-ring w-full border px-4 py-3 text-sm outline-none ${
      invalid ? "" : ""
    }`;

  return (
    <div className="space-y-3 border p-4" style={surfaceStyle(theme)}>
      <div>
        <p
          className="text-sm font-semibold"
          style={{
            color: theme.textColor,
            fontFamily: theme.headingFontFamily,
          }}
        >
          Endereço de entrega
        </p>
        <p className="mt-0.5 text-xs" style={{ color: theme.mutedTextColor }}>
          Campos com * são obrigatórios para concluir o pedido.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="CEP"
          required
          error={errors.cep}
          htmlFor="delivery-cep"
          theme={theme}
        >
          <input
            id="delivery-cep"
            value={formatCepDisplay(address.cep ?? "")}
            onChange={(event) =>
              patch({ cep: normalizeCep(event.target.value) })
            }
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            className={fieldInput(Boolean(errors.cep))}
            style={inputStyle(theme, { invalid: Boolean(errors.cep) })}
          />
        </Field>
        <Field
          label="Estado (UF)"
          required
          error={errors.state}
          htmlFor="delivery-state"
          theme={theme}
        >
          <input
            id="delivery-state"
            value={address.state ?? ""}
            onChange={(event) =>
              patch({ state: normalizeState(event.target.value) })
            }
            autoComplete="address-level1"
            placeholder="SP"
            maxLength={2}
            className={fieldInput(Boolean(errors.state))}
            style={inputStyle(theme, { invalid: Boolean(errors.state) })}
          />
        </Field>
      </div>

      <Field
        label="Endereço"
        required
        error={errors.street}
        htmlFor="delivery-street"
        theme={theme}
      >
        <input
          id="delivery-street"
          value={address.street}
          onChange={(event) => patch({ street: event.target.value })}
          autoComplete="address-line1"
          placeholder="Rua das Flores"
          className={fieldInput(Boolean(errors.street))}
          style={inputStyle(theme, { invalid: Boolean(errors.street) })}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Número"
          required
          error={errors.number}
          htmlFor="delivery-number"
          theme={theme}
        >
          <input
            id="delivery-number"
            value={address.number}
            onChange={(event) => patch({ number: event.target.value })}
            autoComplete="address-line2"
            placeholder="123"
            className={fieldInput(Boolean(errors.number))}
            style={inputStyle(theme, { invalid: Boolean(errors.number) })}
          />
        </Field>
        <Field
          label="Complemento"
          error={errors.complement}
          htmlFor="delivery-complement"
          theme={theme}
        >
          <input
            id="delivery-complement"
            value={address.complement ?? ""}
            onChange={(event) => patch({ complement: event.target.value })}
            placeholder="Apto, bloco…"
            className={fieldInput(Boolean(errors.complement))}
            style={inputStyle(theme, { invalid: Boolean(errors.complement) })}
          />
        </Field>
      </div>

      <Field
        label="Bairro"
        required
        error={errors.neighborhood}
        htmlFor="delivery-neighborhood"
        theme={theme}
      >
        <input
          id="delivery-neighborhood"
          value={address.neighborhood}
          onChange={(event) => patch({ neighborhood: event.target.value })}
          placeholder="Centro"
          className={fieldInput(Boolean(errors.neighborhood))}
          style={inputStyle(theme, { invalid: Boolean(errors.neighborhood) })}
        />
      </Field>

      <Field
        label="Cidade"
        required
        error={errors.city}
        htmlFor="delivery-city"
        theme={theme}
      >
        <input
          id="delivery-city"
          value={address.city ?? ""}
          onChange={(event) => patch({ city: event.target.value })}
          autoComplete="address-level2"
          placeholder="São Paulo"
          className={fieldInput(Boolean(errors.city))}
          style={inputStyle(theme, { invalid: Boolean(errors.city) })}
        />
      </Field>

      <Field
        label="Referência"
        error={errors.reference}
        htmlFor="delivery-reference"
        theme={theme}
      >
        <input
          id="delivery-reference"
          value={address.reference ?? ""}
          onChange={(event) => patch({ reference: event.target.value })}
          placeholder="Ponto de referência (opcional)"
          className={fieldInput(Boolean(errors.reference))}
          style={inputStyle(theme, { invalid: Boolean(errors.reference) })}
        />
      </Field>

      {summarizeDeliveryAddress(address) ? (
        <div
          className="border px-3 py-2 text-xs"
          style={{
            borderRadius: radiusToCss(theme.buttonRadius),
            borderColor: `color-mix(in srgb, ${theme.primaryColor} 35%, transparent)`,
            backgroundColor: `color-mix(in srgb, ${theme.primaryColor} 12%, transparent)`,
            color: theme.mutedTextColor,
          }}
        >
          <p className="font-semibold" style={{ color: theme.textColor }}>
            Resumo do endereço
          </p>
          <p className="mt-1">{summarizeDeliveryAddress(address)}</p>
        </div>
      ) : null}
    </div>
  );
}
