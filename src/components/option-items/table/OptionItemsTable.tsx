import { ChevronLeft, ChevronRight, ImageIcon, Pencil, Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import TableLoadingState from "@/components/shared/TableLoadingState";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { CompositionOptionWithGroup } from "@/features/product-composition";
import OptionItemStatusBadge from "@/features/product-composition/components/OptionItemStatusBadge";
import { resolveOptionImage } from "@/features/product-composition/utils/optionImage";

interface OptionItemsTableProps {
  options: CompositionOptionWithGroup[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (option: CompositionOptionWithGroup) => void;
  onDelete: (option: CompositionOptionWithGroup) => void;
}

export default function OptionItemsTable({
  options,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  onEdit,
  onDelete,
}: OptionItemsTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <TableLoadingState label="Carregando itens de opções" />
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          title="Nenhum item encontrado"
          description="Cadastre itens de opção ou ajuste os filtros de busca."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="px-6 py-4 text-left">Item</th>
            <th className="text-left">Grupo</th>
            <th className="text-left">Preço</th>
            <th className="text-left">Estoque</th>
            <th className="text-left">Status</th>
            <th className="text-left">Ordem</th>
            <th className="pr-6 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {options.length === 0 && (
            <tr>
              <td colSpan={7} className="p-10 text-center text-slate-500">
                Nenhum item de opção encontrado.
              </td>
            </tr>
          )}

          {options.map((option) => {
            const imageUrl = resolveOptionImage(option);

            return (
              <tr
                key={option.id}
                className="border-b transition hover:bg-slate-50"
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={option.name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <ImageIcon size={20} />
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-slate-900">
                        {option.name}
                      </p>
                      {option.description && (
                        <p className="mt-1 text-sm text-slate-500">
                          {option.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                <td className="text-sm text-slate-700">
                  {option.option_groups?.name ?? "—"}
                </td>

                <td className="text-sm font-medium text-slate-700">
                  {formatCurrency(option.price)}
                </td>

                <td className="text-sm text-slate-600">
                  {option.stock_control ? option.stock : "—"}
                </td>

                <td>
                  <OptionItemStatusBadge active={option.active} />
                </td>

                <td>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                    {option.sort_order}
                  </span>
                </td>

                <td>
                  <div className="flex justify-end gap-2 pr-6">
                    <button
                      type="button"
                      onClick={() => onEdit(option)}
                      className="rounded-xl p-2 hover:bg-slate-100"
                      aria-label={`Editar ${option.name}`}
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(option)}
                      className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                      aria-label={`Excluir ${option.name}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
        <p className="text-sm text-slate-500">
          Página {page} de {totalPages} · {total} item(ns)
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft size={16} />
            Anterior
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Próxima
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
