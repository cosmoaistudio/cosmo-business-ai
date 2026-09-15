import { useState } from "react";
import OptionItemsHeader from "@/components/option-items/OptionItemsHeader";
import OptionItemsTable from "@/components/option-items/table/OptionItemsTable";
import {
  DeleteOptionItemDialog,
  OptionItemFilters,
  OptionItemModal,
  useOptionItems,
  type CompositionOptionWithGroup,
} from "@/features/product-composition";

export default function OptionItemsPage() {
  const {
    options,
    groups,
    loading,
    search,
    setSearch,
    status,
    setStatus,
    groupId,
    setGroupId,
    page,
    setPage,
    total,
    totalPages,
    reload,
  } = useOptionItems();

  const [editingOption, setEditingOption] =
    useState<CompositionOptionWithGroup | null>(null);
  const [deletingOption, setDeletingOption] =
    useState<CompositionOptionWithGroup | null>(null);

  return (
    <div className="space-y-8">
      <OptionItemsHeader groups={groups} reload={reload} />

      <OptionItemFilters
        search={search}
        status={status}
        groupId={groupId}
        groups={groups}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onGroupChange={setGroupId}
      />

      <OptionItemsTable
        options={options}
        loading={loading}
        page={page}
        totalPages={totalPages}
        total={total}
        onPageChange={setPage}
        onEdit={setEditingOption}
        onDelete={setDeletingOption}
      />

      {editingOption && (
        <OptionItemModal
          option={editingOption}
          groups={groups}
          onClose={() => setEditingOption(null)}
          onSaved={reload}
        />
      )}

      {deletingOption && (
        <DeleteOptionItemDialog
          option={deletingOption}
          open={Boolean(deletingOption)}
          onOpenChange={(open) => {
            if (!open) setDeletingOption(null);
          }}
          onDeleted={reload}
        />
      )}
    </div>
  );
}
