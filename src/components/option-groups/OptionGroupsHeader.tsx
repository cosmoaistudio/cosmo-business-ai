import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { OptionGroupModal } from "@/features/product-composition";

interface OptionGroupsHeaderProps {
  reload: () => void;
  openCreateRequest?: number;
  onGroupSaved?: () => void | Promise<void>;
}

export default function OptionGroupsHeader({
  reload,
  openCreateRequest = 0,
  onGroupSaved,
}: OptionGroupsHeaderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (openCreateRequest > 0) {
      setOpen(true);
    }
  }, [openCreateRequest]);

  return (
    <>
      <PageHeader
        title="Grupos de Opções"
        subtitle="Configure grupos reutilizáveis para composição de produtos personalizáveis."
        action={
          <Button className="rounded-xl" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Grupo
          </Button>
        }
      />

      {open && (
        <OptionGroupModal
          onClose={() => setOpen(false)}
          onSaved={(_group) => {
            reload();
            void onGroupSaved?.();
          }}
        />
      )}
    </>
  );
}
