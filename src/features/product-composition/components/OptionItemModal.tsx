import AppModal from "@/components/shared/AppModal";
import type { CompositionOptionWithGroup } from "../types/option";
import type { OptionGroup } from "../types/optionGroup";
import OptionItemForm from "./OptionItemForm";

interface OptionItemModalProps {
  option?: CompositionOptionWithGroup;
  groups: OptionGroup[];
  onClose: () => void;
  onSaved: () => void;
}

export default function OptionItemModal({
  option,
  groups,
  onClose,
  onSaved,
}: OptionItemModalProps) {
  const isEditing = Boolean(option);

  return (
    <AppModal
      title={isEditing ? "Editar Item" : "Novo Item de Opção"}
      onClose={onClose}
    >
      <OptionItemForm
        option={option}
        groups={groups}
        onCancel={onClose}
        onSuccess={() => {
          onSaved();
          onClose();
        }}
      />
    </AppModal>
  );
}
