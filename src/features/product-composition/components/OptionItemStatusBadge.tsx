interface OptionItemStatusBadgeProps {
  active: boolean;
}

export default function OptionItemStatusBadge({
  active,
}: OptionItemStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
