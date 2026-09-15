import {
  productMenuKindEmoji,
  productMenuKindLabel,
} from "../utils/productMenuKind";
import type { ProductMenuKind } from "../types/product";

export default function ProductMenuKindBadge({
  kind,
}: {
  kind: ProductMenuKind | "paused";
}) {
  const styles: Record<ProductMenuKind | "paused", string> = {
    simple: "bg-slate-100 text-slate-700",
    assembled: "bg-sky-100 text-sky-800",
    combo: "bg-violet-100 text-violet-800",
    paused: "bg-amber-100 text-amber-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[kind]}`}
    >
      <span aria-hidden>{productMenuKindEmoji(kind)}</span>
      {productMenuKindLabel(kind)}
    </span>
  );
}
