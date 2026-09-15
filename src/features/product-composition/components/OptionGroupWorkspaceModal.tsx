import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import AppModal from "@/components/shared/AppModal";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useOptions } from "../hooks/useOptions";
import type { CompositionOption } from "../types/option";
import type { OptionGroup } from "../types/optionGroup";
import OptionGroupForm from "./OptionGroupForm";
import OptionItemModal from "./OptionItemModal";
import DeleteOptionItemDialog from "./DeleteOptionItemDialog";

interface OptionGroupWorkspaceModalProps {
  /** When provided, opens in edit mode for that group. */
  optionGroup?: OptionGroup | null;
  onClose: () => void;
  /** Called after group create/update (and when options change while editing). */
  onSaved: (group: OptionGroup) => void;
}

/**
 * Contextual create/edit for option groups + their options.
 * Reuses OptionGroupForm / OptionItemModal / productCompositionService.
 */
export default function OptionGroupWorkspaceModal({
  optionGroup: initialGroup = null,
  onClose,
  onSaved,
}: OptionGroupWorkspaceModalProps) {
  const [group, setGroup] = useState<OptionGroup | null>(initialGroup);
  const [creatingOption, setCreatingOption] = useState(false);
  const [editingOption, setEditingOption] = useState<CompositionOption | null>(
    null
  );
  const [deletingOption, setDeletingOption] = useState<CompositionOption | null>(
    null
  );

  const { options, loading: optionsLoading, reload: reloadOptions } = useOptions(
    group?.id
  );

  useEffect(() => {
    setGroup(initialGroup);
  }, [initialGroup]);

  const title = group
    ? `Adicional · ${group.name}`
    : "Criar adicional";

  return (
    <AppModal title={title} onClose={onClose} size="xl">
      <div className="space-y-6">
        <OptionGroupForm
          optionGroup={group ?? undefined}
          onCancel={onClose}
          onSuccess={(saved) => {
            setGroup(saved);
            onSaved(saved);
          }}
        />

        {group ? (
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Opções deste adicional
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Itens que o cliente pode escolher neste grupo.
                </p>
              </div>
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => setCreatingOption(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova opção
              </Button>
            </div>

            {optionsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : options.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                Nenhuma opção ainda. Adicione itens como Sabores, Frutas ou
                Complementos.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {options.map((option) => (
                  <li
                    key={option.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {option.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatCurrency(Number(option.price) || 0)}
                        {option.active === false ? " · inativa" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-lg"
                        aria-label={`Editar ${option.name}`}
                        onClick={() => setEditingOption(option)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-lg text-red-600"
                        aria-label={`Remover ${option.name}`}
                        onClick={() => setDeletingOption(option)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>

      {group && creatingOption ? (
        <OptionItemModal
          groups={[group]}
          onClose={() => setCreatingOption(false)}
          onSaved={() => {
            void reloadOptions();
            onSaved(group);
          }}
        />
      ) : null}

      {group && editingOption ? (
        <OptionItemModal
          option={{ ...editingOption, option_groups: group }}
          groups={[group]}
          onClose={() => setEditingOption(null)}
          onSaved={() => {
            void reloadOptions();
            onSaved(group);
          }}
        />
      ) : null}

      {group && deletingOption ? (
        <DeleteOptionItemDialog
          option={{ ...deletingOption, option_groups: group }}
          open
          onOpenChange={(open) => {
            if (!open) setDeletingOption(null);
          }}
          onDeleted={() => {
            void reloadOptions();
            onSaved(group);
            setDeletingOption(null);
          }}
        />
      ) : null}
    </AppModal>
  );
}
