import { Loader2 } from "lucide-react";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import DigitalProductCard from "./DigitalProductCard";

interface DigitalMenuGridProps {
  products: DigitalMenuProduct[];
  loading: boolean;
  onSelectProduct: (productId: string) => void;
}

export default function DigitalMenuGrid({
  products,
  loading,
  onSelectProduct,
}: DigitalMenuGridProps) {
  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center text-slate-300">
        Nenhum produto disponível no momento.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <DigitalProductCard
          key={product.id}
          product={product}
          onSelect={() => onSelectProduct(product.id)}
        />
      ))}
    </div>
  );
}
