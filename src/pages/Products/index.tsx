import ProductsHeader from "../../components/products/ProductsHeader";
import ProductsSearch from "../../components/products/ProductsSearch";
import ProductsStats from "../../components/products/stats/ProductsStats";
import ProductsTable from "../../components/products/table/ProductsTable";

import { useProducts } from "@/features/products";

export default function Products() {

  const {
    products,
    loading,
    reload,
  } = useProducts();

  return (
    <div className="space-y-8">

      <ProductsHeader reload={reload} />

      <ProductsStats />

      <ProductsSearch />

      <ProductsTable
        products={products}
        loading={loading}
      />

    </div>
  );
}