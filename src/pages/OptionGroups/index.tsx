import { useState } from "react";
import { toast } from "sonner";
import { Layers } from "lucide-react";
import OptionGroupsHeader from "@/components/option-groups/OptionGroupsHeader";
import OptionGroupsTable from "@/components/option-groups/table/OptionGroupsTable";
import {
  compositionAdminService,
  DeleteOptionGroupDialog,
  OptionGroupFilters,
  OptionGroupModal,
  useOptionGroups,
  type OptionGroup,
} from "@/features/product-composition";
import {
  ContextualSetupBanner,
  useContextualSetup,
} from "@/features/operation-onboarding";

export default function OptionGroupsPage() {
  const {
    optionGroups,
    loading,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    total,
    totalPages,
    reload,
  } = useOptionGroups();

  const {
    presentation,
    dismiss,
    acknowledgeSuccess,
    refreshAfterAction,
  } = useContextualSetup({
    relevantStepIds: ["addons"],
  });

  const [createRequest, setCreateRequest] = useState(0);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<OptionGroup | null>(null);
  const [duplicating, setDuplicating] = useState(false);

  async function handleDuplicate(group: OptionGroup) {
    const confirmed = window.confirm(
      `Duplicar o grupo "${group.name}"?\n\n` +
        `Será criada uma cópia independente do grupo e de todas as opções.`
    );
    if (!confirmed || duplicating) return;

    try {
      setDuplicating(true);
      await compositionAdminService.duplicateGroup(group.id);
      toast.success("Grupo duplicado com sucesso.");
      reload();
      void refreshAfterAction();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao duplicar grupo."
      );
    } finally {
      setDuplicating(false);
    }
  }

  return (
    <div className="space-y-8">
      <ContextualSetupBanner
        presentation={presentation}
        icon={<Layers size={18} />}
        ctaLabel="Criar grupo de adicionais"
        onPrimaryAction={() => setCreateRequest((n) => n + 1)}
        onDismiss={dismiss}
        onAcknowledgeSuccess={acknowledgeSuccess}
      />

      <OptionGroupsHeader
        reload={reload}
        openCreateRequest={createRequest}
        onGroupSaved={() => void refreshAfterAction()}
      />

      <OptionGroupFilters
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <OptionGroupsTable
        optionGroups={optionGroups}
        loading={loading || duplicating}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onEdit={setEditingGroup}
        onDuplicate={handleDuplicate}
        onDelete={setDeletingGroup}
      />

      {editingGroup && (
        <OptionGroupModal
          optionGroup={editingGroup}
          onClose={() => setEditingGroup(null)}
          onSaved={(_group) => {
            reload();
            void refreshAfterAction();
          }}
        />
      )}

      {deletingGroup && (
        <DeleteOptionGroupDialog
          optionGroup={deletingGroup}
          open={Boolean(deletingGroup)}
          onOpenChange={(open) => {
            if (!open) setDeletingGroup(null);
          }}
          onDeleted={reload}
        />
      )}
    </div>
  );
}
