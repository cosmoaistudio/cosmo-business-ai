import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppModal from "@/components/shared/AppModal";
import {
  OptionGroupStatusBadge,
  OptionGroupTypeBadge,
  OptionGroupWorkspaceModal,
  type LinkedGroupView,
} from "@/features/product-composition";
import type { OptionGroup } from "@/features/product-composition/types/optionGroup";
import type { ProductOptionGroupWithGroup } from "@/features/product-composition/types/productOptionGroup";
import {
  formatOptionGroupOptionsCount,
  formatOptionGroupSelectionRule,
} from "@/features/product-composition/utils/productOptionLinkRules";

export interface ProductOptionsEditorApi {
  linkedGroups: LinkedGroupView[];
  availableGroups: OptionGroup[];
  loading: boolean;
  saving: boolean;
  addGroup: (groupId: string, knownGroup?: OptionGroup) => Promise<boolean>;
  removeGroup: (linkId: string) => Promise<void>;
  moveGroup: (linkId: string, direction: "up" | "down") => Promise<void>;
  attachCreatedGroup: (group: OptionGroup) => Promise<void>;
  refreshGroupMeta: (group: OptionGroup) => Promise<void>;
  reload: () => Promise<void>;
}

interface ProductOptionsTabProps {
  productId?: string;
  editor: ProductOptionsEditorApi;
  /** Notify parent (operation onboarding refresh). */
  onAddonChanged?: () => void;
}

export default function ProductOptionsTab({
  productId,
  editor,
  onAddonChanged,
}: ProductOptionsTabProps) {
  const {
    linkedGroups,
    availableGroups,
    loading,
    saving,
    addGroup,
    removeGroup,
    moveGroup,
    attachCreatedGroup,
    refreshGroupMeta,
  } = editor;

  const [workspaceMode, setWorkspaceMode] = useState<"create" | "edit" | null>(
    null
  );
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkSearch, setLinkSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [groupToRemove, setGroupToRemove] =
    useState<ProductOptionGroupWithGroup | null>(null);

  const filteredAvailable = useMemo(() => {
    const query = linkSearch.trim().toLowerCase();
    if (!query) return availableGroups;
    return availableGroups.filter((group) =>
      group.name.toLowerCase().includes(query)
    );
  }, [availableGroups, linkSearch]);

  async function handleConfirmRemove() {
    if (!groupToRemove) return;
    await removeGroup(groupToRemove.id);
    setGroupToRemove(null);
  }

  async function handleLinkSelected() {
    if (!selectedGroupId) return;
    const ok = await addGroup(selectedGroupId);
    if (ok) {
      setSelectedGroupId("");
      setLinkSearch("");
      setLinkOpen(false);
      onAddonChanged?.();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          Opções e adicionais
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {productId
            ? "Personalize este produto sem sair da edição."
            : "Você pode criar ou reservar adicionais agora; eles serão vinculados ao salvar o produto."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="rounded-xl"
          disabled={saving}
          onClick={() => {
            setEditingGroup(null);
            setWorkspaceMode("create");
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Criar adicional
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={saving || availableGroups.length === 0}
          onClick={() => setLinkOpen(true)}
        >
          <Link2 className="mr-2 h-4 w-4" />
          Vincular existente
        </Button>
      </div>

      {linkedGroups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="font-medium text-slate-700">
            Adicione opções para que seu cliente personalize este produto.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Crie grupos como Frutas, Complementos ou Coberturas, ou vincule um
            adicional já cadastrado.
          </p>
          {availableGroups.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              Você ainda não possui adicionais cadastrados.
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => {
                setEditingGroup(null);
                setWorkspaceMode("create");
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {availableGroups.length === 0
                ? "Criar meu primeiro adicional"
                : "Criar adicional"}
            </Button>
            {availableGroups.length > 0 && (
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setLinkOpen(true)}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Vincular existente
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {linkedGroups.map((link, index) => {
            const group = link.option_groups;
            if (!group) return null;

            return (
              <div
                key={link.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        #{index + 1}
                      </span>
                      <h4 className="text-base font-semibold text-slate-900">
                        {group.name}
                      </h4>
                      <OptionGroupStatusBadge required={group.required} />
                      <OptionGroupTypeBadge
                        selectionType={group.selection_type}
                      />
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {formatOptionGroupOptionsCount(link.optionCount)}
                      <span aria-hidden> · </span>
                      {formatOptionGroupSelectionRule(group)}
                    </p>

                    {group.description ? (
                      <p className="mt-2 text-sm text-slate-500">
                        {group.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      disabled={saving || index === 0}
                      onClick={() => void moveGroup(link.id, "up")}
                      aria-label={`Mover ${group.name} para cima`}
                    >
                      <ArrowUp size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      disabled={saving || index === linkedGroups.length - 1}
                      onClick={() => void moveGroup(link.id, "down")}
                      aria-label={`Mover ${group.name} para baixo`}
                    >
                      <ArrowDown size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      disabled={saving}
                      onClick={() => {
                        setEditingGroup(group);
                        setWorkspaceMode("edit");
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl text-red-600 hover:border-red-200 hover:bg-red-50"
                      disabled={saving}
                      onClick={() => setGroupToRemove(link)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {workspaceMode ? (
        <OptionGroupWorkspaceModal
          optionGroup={workspaceMode === "edit" ? editingGroup : null}
          onClose={() => {
            setWorkspaceMode(null);
            setEditingGroup(null);
          }}
          onSaved={(group) => {
            void (async () => {
              if (workspaceMode === "create") {
                await attachCreatedGroup(group);
                setEditingGroup(group);
                setWorkspaceMode("edit");
              } else {
                await refreshGroupMeta(group);
              }
              onAddonChanged?.();
            })();
          }}
        />
      ) : null}

      {linkOpen ? (
        <AppModal
          title="Vincular adicional existente"
          onClose={() => {
            setLinkOpen(false);
            setSelectedGroupId("");
            setLinkSearch("");
          }}
          size="md"
        >
          <div className="space-y-4">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                value={linkSearch}
                onChange={(event) => setLinkSearch(event.target.value)}
                placeholder="Buscar adicional…"
                className="cosmo-input w-full py-3 pl-10 pr-3"
              />
            </label>

            {filteredAvailable.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Nenhum adicional disponível para vincular.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {filteredAvailable.map((group) => (
                  <label
                    key={group.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 ${
                      selectedGroupId === group.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="link-group"
                      className="mt-1"
                      checked={selectedGroupId === group.id}
                      onChange={() => setSelectedGroupId(group.id)}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-slate-900">
                        {group.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {formatOptionGroupSelectionRule(group)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="cosmo-modal-actions">
              <button
                type="button"
                className="cosmo-btn-cancel rounded-xl border px-5 py-3"
                onClick={() => setLinkOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedGroupId || saving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
                onClick={() => void handleLinkSelected()}
              >
                {saving ? "Vinculando…" : "Vincular"}
              </button>
            </div>
          </div>
        </AppModal>
      ) : null}

      <Dialog
        open={groupToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setGroupToRemove(null);
        }}
      >
        <DialogContent showCloseButton={!saving}>
          <DialogHeader>
            <DialogTitle>Remover vínculo do produto</DialogTitle>
            <DialogDescription>
              Remover <strong>{groupToRemove?.option_groups?.name}</strong>{" "}
              deste produto? O adicional e suas opções continuam disponíveis
              para outros produtos.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setGroupToRemove(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={saving}
              onClick={() => void handleConfirmRemove()}
            >
              {saving ? "Removendo..." : "Remover vínculo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
