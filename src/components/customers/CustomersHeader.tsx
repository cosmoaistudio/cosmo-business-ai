import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { CustomerModal } from "@/features/customers";

interface CustomersHeaderProps {
  reload: () => void;
}

export default function CustomersHeader({ reload }: CustomersHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Gerencie sua base de clientes, histórico de compras e fidelização."
        action={
          <Button className="rounded-xl" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        }
      />

      {open && (
        <CustomerModal
          onClose={() => setOpen(false)}
          onSaved={reload}
        />
      )}
    </>
  );
}
