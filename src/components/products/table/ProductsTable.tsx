import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import type { Product } from "@/features/products";

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
}

export default function ProductsTable({
  products,
  loading,
}: ProductsTableProps) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        Carregando produtos...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <table className="w-full">

        <thead>

          <tr className="border-b bg-slate-50">

            <th className="px-6 py-4 text-left">
              Produto
            </th>

            <th className="text-left">
              Categoria
            </th>

            <th className="text-left">
              Preço
            </th>

            <th className="text-left">
              Estoque
            </th>

            <th className="text-left">
              Status
            </th>

            <th className="text-right pr-6">
              Ações
            </th>

          </tr>

        </thead>

        <tbody>

          {products.length === 0 && (
            <tr>

              <td
                colSpan={6}
                className="p-10 text-center text-slate-500"
              >
                Nenhum produto cadastrado.
              </td>

            </tr>
          )}

          {products.map((product) => (

            <tr
              key={product.id}
              className="border-b transition hover:bg-slate-50"
            >

              <td className="px-6 py-5 font-semibold">
                {product.name}
              </td>

              <td>
                {product.category}
              </td>

              <td>
                R$ {product.price.toFixed(2)}
              </td>

              <td>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-600">

                  {product.stock}

                </span>

              </td>

              <td>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    product.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {product.status === "active"
                    ? "Ativo"
                    : "Inativo"}
                </span>

              </td>

              <td>

                <div className="flex justify-end gap-2 pr-6">

                  <button className="rounded-xl p-2 hover:bg-slate-100">
                    <Pencil size={18} />
                  </button>

                  <button className="rounded-xl p-2 hover:bg-slate-100">
                    <Trash2 size={18} />
                  </button>

                  <button className="rounded-xl p-2 hover:bg-slate-100">
                    <MoreHorizontal size={18} />
                  </button>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}