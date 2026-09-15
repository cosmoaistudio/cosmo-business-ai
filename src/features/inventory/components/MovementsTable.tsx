import { ProductThumbnail } from "@/features/products";
import { MOVEMENT_TYPE_LABELS } from "../types/inventory";
import type { StockMovement } from "../types/inventory";
import Card from "@/components/shared/Card";

interface MovementsTableProps {
  movements: StockMovement[];
  loading?: boolean;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MovementsTable({
  movements,
  loading = false,
}: MovementsTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Histórico de movimentações
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Entradas, saídas e vendas registradas automaticamente.
        </p>
      </div>

      {loading && (
        <div className="p-10 text-center text-sm text-slate-500">
          Carregando movimentações...
        </div>
      )}

      {!loading && movements.length === 0 && (
        <div className="p-10 text-center text-sm text-slate-500">
          Nenhuma movimentação registrada ainda.
        </div>
      )}

      {!loading && movements.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Produto</th>
                <th className="px-6 py-4 font-medium">Tipo</th>
                <th className="px-6 py-4 font-medium">Qtd.</th>
                <th className="px-6 py-4 font-medium">Anterior</th>
                <th className="px-6 py-4 font-medium">Novo</th>
                <th className="px-6 py-4 font-medium">Observação</th>
              </tr>
            </thead>

            <tbody>
              {movements.map((movement) => (
                <tr
                  key={movement.id}
                  className="border-t border-slate-100 hover:bg-slate-50/80"
                >
                  <td className="px-6 py-4 text-slate-600">
                    {formatDate(movement.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ProductThumbnail
                        product={{
                          name: movement.products?.name ?? "Produto",
                          image_url: movement.products?.image_url,
                          image: movement.products?.image,
                        }}
                        size="xs"
                      />
                      <span className="font-medium text-slate-900">
                        {movement.products?.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        movement.movement_type === "entry"
                          ? "bg-emerald-100 text-emerald-700"
                          : movement.movement_type === "exit"
                            ? "bg-red-100 text-red-700"
                            : movement.movement_type === "sale"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {MOVEMENT_TYPE_LABELS[movement.movement_type]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-900">
                    {movement.quantity}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {movement.previous_stock}
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {movement.new_stock}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {movement.notes ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
