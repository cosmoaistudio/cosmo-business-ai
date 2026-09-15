import type { OptionGroup } from "../types/optionGroup";

interface OptionGroupStatusBadgeProps {
  required: boolean;
}

export default function OptionGroupStatusBadge({
  required,
}: OptionGroupStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        required
          ? "bg-amber-100 text-amber-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {required ? "Obrigatório" : "Opcional"}
    </span>
  );
}

interface OptionGroupTypeBadgeProps {
  selectionType: OptionGroup["selection_type"];
}

export function OptionGroupTypeBadge({
  selectionType,
}: OptionGroupTypeBadgeProps) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
      {selectionType === "radio" ? "Radio" : "Checkbox"}
    </span>
  );
}
