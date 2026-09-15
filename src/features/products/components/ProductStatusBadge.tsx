import type { Product } from "../types/product";

interface ProductStatusBadgeProps {
  status: Product["status"];
  className?: string;
}

export default function ProductStatusBadge({
  status,
  className = "",
}: ProductStatusBadgeProps) {
  const isActive = status === "active";

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-semibold ${
        isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      } ${className}`}
    >
      {isActive ? "Ativo" : "Inativo"}
    </span>
  );
}
