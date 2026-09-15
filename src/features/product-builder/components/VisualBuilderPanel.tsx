import { AlertTriangle, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CompositionOption } from "@/features/product-composition/types/option";
import type { BuilderGroupState } from "../types/builder";
import OptionGroupEditor from "./OptionGroupEditor";
import SortableList from "./SortableList";

interface VisualBuilderPanelProps {
  groups: BuilderGroupState[];
  linkedGroups: BuilderGroupState[];
  expandedGroupId: string | null;
  groupErrors?: Record<string, string[]>;
  onAddGroup: () => void;
  onDuplicateGroup: (groupId: string) => void;
  onRemoveGroup: (groupId: string) => void;
  onToggleGroup: (groupId: string) => void;
  onReorderGroups: (from: number, to: number) => void;
  onUpdateGroup: (groupId: string, patch: Partial<BuilderGroupState["group"]>) => void;
  onUpdateOption: (
    groupId: string,
    optionId: string,
    patch: Partial<CompositionOption>
  ) => void;
  onReorderOptions: (groupId: string, from: number, to: number) => void;
  onExpandGroup: (groupId: string | null) => void;
}

export default function VisualBuilderPanel({
  groups,
  linkedGroups,
  expandedGroupId,
  groupErrors = {},
  onAddGroup,
  onDuplicateGroup,
  onRemoveGroup,
  onToggleGroup,
  onReorderGroups,
  onUpdateGroup,
  onUpdateOption,
  onReorderOptions,
  onExpandGroup,
}: VisualBuilderPanelProps) {
  const availableGroups = groups.filter(
    (group) => !group.linked && !group.isSizeGroup
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
            Construtor Visual
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Grupos e opções
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Arraste para reordenar. Configure tipo, regras e opções enterprise.
          </p>
        </div>

        <Button
          type="button"
          className="rounded-xl"
          onClick={onAddGroup}
        >
          <Plus size={16} />
          Adicionar grupo
        </Button>
      </div>

      <SortableList
        items={linkedGroups}
        getKey={(group) => group.groupId}
        onReorder={onReorderGroups}
        emptyMessage="Adicione um grupo para montar a composição do produto."
        renderItem={(group, index) => (
          <div className="space-y-2">
            {(groupErrors[group.groupId]?.length ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  {groupErrors[group.groupId]?.map((error) => (
                    <p key={error}>{error}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <OptionGroupEditor
                group={group}
                index={index + 1}
                expanded={expandedGroupId === group.groupId}
                onToggleExpand={() =>
                  onExpandGroup(
                    expandedGroupId === group.groupId ? null : group.groupId
                  )
                }
                onUpdateGroup={(patch) => onUpdateGroup(group.groupId, patch)}
                onUpdateOption={(optionId, patch) =>
                  onUpdateOption(group.groupId, optionId, patch)
                }
                onReorderOptions={(from, to) =>
                  onReorderOptions(group.groupId, from, to)
                }
              />

              <div className="absolute right-4 top-4 flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-white"
                  onClick={() => onDuplicateGroup(group.groupId)}
                  aria-label="Duplicar grupo"
                >
                  <Copy size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-white text-red-600"
                  onClick={() => onRemoveGroup(group.groupId)}
                  aria-label="Remover grupo"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </div>
        )}
      />

      {availableGroups.length > 0 && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Grupos existentes na biblioteca
          </p>
          <div className="flex flex-wrap gap-2">
            {availableGroups.map((group) => (
              <Button
                key={group.groupId}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => onToggleGroup(group.groupId)}
              >
                <Plus size={14} />
                {group.group.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
