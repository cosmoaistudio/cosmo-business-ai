import AppModal from "@/components/shared/AppModal";
import type { OptionGroup } from "../types/optionGroup";
import OptionGroupForm from "./OptionGroupForm";

interface OptionGroupModalProps {
  optionGroup?: OptionGroup;
  onClose: () => void;
  onSaved: (group: OptionGroup) => void;
}

export default function OptionGroupModal({
  optionGroup,
  onClose,
  onSaved,
}: OptionGroupModalProps) {
  const isEditing = Boolean(optionGroup);

  return (
    <AppModal
      title={isEditing ? "Editar Grupo" : "Novo Grupo de Opções"}
      onClose={onClose}
    >
      <OptionGroupForm
        optionGroup={optionGroup}
        onCancel={onClose}
        onSuccess={(group) => {
          onSaved(group);
          onClose();
        }}
      />
    </AppModal>
  );
}
