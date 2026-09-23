import type { DigitalDeliveryAddress } from "../types/digitalOrdering.types";

export const EMPTY_DELIVERY_ADDRESS: DigitalDeliveryAddress = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  reference: "",
};

const REQUIRED_KEYS: Array<keyof DigitalDeliveryAddress> = [
  "cep",
  "street",
  "number",
  "neighborhood",
  "city",
  "state",
];

export type DeliveryAddressErrors = Partial<
  Record<keyof DigitalDeliveryAddress, string>
>;

export function normalizeCep(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCepDisplay(value: string): string {
  const digits = normalizeCep(value);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function normalizeState(value: string): string {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

export function validateDeliveryAddress(
  address: DigitalDeliveryAddress
): DeliveryAddressErrors {
  const errors: DeliveryAddressErrors = {};
  const cep = normalizeCep(address.cep ?? "");
  if (cep.length !== 8) errors.cep = "Informe um CEP válido com 8 dígitos.";
  if (!address.street?.trim()) errors.street = "Informe a rua ou avenida.";
  if (!address.number?.trim()) errors.number = "Informe o número.";
  if (!address.neighborhood?.trim()) errors.neighborhood = "Informe o bairro.";
  if (!address.city?.trim()) errors.city = "Informe a cidade.";
  const state = normalizeState(address.state ?? "");
  if (state.length !== 2) errors.state = "Informe a UF (2 letras).";
  return errors;
}

export function isDeliveryAddressComplete(
  address: DigitalDeliveryAddress
): boolean {
  return Object.keys(validateDeliveryAddress(address)).length === 0;
}

export function sanitizeDeliveryAddressForContext(
  address: DigitalDeliveryAddress
): DigitalDeliveryAddress {
  return {
    cep: normalizeCep(address.cep ?? ""),
    street: address.street.trim(),
    number: address.number.trim(),
    complement: (address.complement ?? "").trim(),
    neighborhood: address.neighborhood.trim(),
    city: (address.city ?? "").trim(),
    state: normalizeState(address.state ?? ""),
    reference: (address.reference ?? "").trim(),
  };
}

export function summarizeDeliveryAddress(
  address: DigitalDeliveryAddress
): string {
  const parts = [
    address.street,
    address.number ? `nº ${address.number}` : null,
    address.complement,
    address.neighborhood,
    [address.city, address.state].filter(Boolean).join(" - "),
    address.cep ? `CEP ${formatCepDisplay(address.cep)}` : null,
    address.reference ? `Ref: ${address.reference}` : null,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);
  return parts.join(", ");
}

export function hasRequiredAddressFields(
  address: DigitalDeliveryAddress
): boolean {
  return REQUIRED_KEYS.every((key) => {
    if (key === "cep") return normalizeCep(address.cep ?? "").length === 8;
    if (key === "state") return normalizeState(address.state ?? "").length === 2;
    return Boolean(String(address[key] ?? "").trim());
  });
}
