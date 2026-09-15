import AppModal from "@/components/shared/AppModal";
import type { Customer } from "../types/customer";
import CustomerForm from "./CustomerForm";

interface CustomerModalProps {
  customer?: Customer;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerModal({
  customer,
  onClose,
  onSaved,
}: CustomerModalProps) {
  const isEditing = Boolean(customer);

  return (
    <AppModal
      title={isEditing ? "Editar Cliente" : "Novo Cliente"}
      onClose={onClose}
    >
      <CustomerForm
        customer={customer}
        onCancel={onClose}
        onSuccess={() => {
          onSaved();
          onClose();
        }}
      />
    </AppModal>
  );
}
