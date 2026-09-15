import { ChevronLeft, ChevronRight, Copy, Pencil, Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import TableLoadingState from "@/components/shared/TableLoadingState";
import { Button } from "@/components/ui/button";
import type { OptionGroup } from "@/features/product-composition";
import OptionGroupStatusBadge, {
  OptionGroupTypeBadge,
} from "@/features/product-composition/components/OptionGroupStatusBadge";

interface OptionGroupsTableProps {
  optionGroups: OptionGroup[];
  loading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onEdit: (optionGroup: OptionGroup) => void;
  onDuplicate?: (optionGroup: OptionGroup) => void;
  onDelete: (optionGroup: OptionGroup) => void;
}

export default function OptionGroupsTable({
  optionGroups,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  onEdit,
  onDuplicate,
  onDelete,
}: OptionGroupsTableProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <TableLoadingState label="Carregando grupos de opções" />
      </div>
    );
  }

  if (optionGroups.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <EmptyState
          title="Nenhum grupo encontrado"
          description="Crie grupos de opções para personalizar produtos no PDV."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-slate-50">
            <th className="px-6 py-4 text-left">Grupo</th>
            <th className="text-left">Status</th>
            <th className="text-left">Tipo</th>
            <th className="text-left">Seleção</th>
            <th className="text-left">Ordem</th>
            <th className="pr-6 text-right">Ações</th>
          </tr>
        </thead>

        <tbody>
          {optionGroups.length === 0 && (
            <tr>
              <td colSpan={6} className="p-10 text-center text-slate-500">
                Nenhum grupo de opções encontrado.
              </td>
            </tr>
          )}

          {optionGroups.map((optionGroup) => (
            <tr
              key={optionGroup.id}
              className="border-b transition hover:bg-slate-50"
            >
              <td className="px-6 py-5">
                <div>
                  <p className="font-semibold text-slate-900">
                    {optionGroup.name}
                  </p>
                  {optionGroup.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {optionGroup.description}
                    </p>
                  )}
                </div>
              </td>

              <td>
                <OptionGroupStatusBadge required={optionGroup.required} />
              </td>

              <td>
                <OptionGroupTypeBadge
                  selectionType={optionGroup.selection_type}
                />
              </td>

              <td className="text-sm text-slate-600">
                {optionGroup.min_selection} – {optionGroup.max_selection}
              </td>

              <td>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                  {optionGroup.sort_order}
                </span>
              </td>

              <td>
                <div className="flex justify-end gap-2 pr-6">
                  <button
                    type="button"
                    onClick={() => onEdit(optionGroup)}
                    className="rounded-xl p-2 hover:bg-slate-100"
                    aria-label={`Editar ${optionGroup.name}`}
                  >
                    <Pencil size={18} />
                  </button>

                  {onDuplicate && (
                    <button
                      type="button"
                      onClick={() => onDuplicate(optionGroup)}
                      className="rounded-xl p-2 hover:bg-slate-100"
                      aria-label={`Duplicar ${optionGroup.name}`}
                      title="Duplicar grupo"
                    >
                      <Copy size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(optionGroup)}
                    className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Excluir ${optionGroup.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-6 py-4">
        <p className="text-sm text-slate-500">
          Página {page} de {totalPages} · {total} grupo(s)
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
