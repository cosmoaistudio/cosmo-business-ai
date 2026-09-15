import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import { OptionItemModal, type OptionGroup } from "@/features/product-composition";

interface OptionItemsHeaderProps {
  groups: OptionGroup[];
  reload: () => void;
}

export default function OptionItemsHeader({
  groups,
  reload,
}: OptionItemsHeaderProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Itens de Opções"
        subtitle="Cadastre opções individuais vinculadas aos grupos de composição."
        action={
          <Button
            className="rounded-xl"
            onClick={() => setOpen(true)}
            disabled={groups.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        }
      />

      {groups.length === 0 && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Cadastre ao menos um grupo de opções antes de criar itens.
        </p>
      )}

      {open && (
        <OptionItemModal
          groups={groups}
          onClose={() => setOpen(false)}
          onSaved={reload}
        />
      )}
    </>
  );
}
