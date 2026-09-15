import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { productCompositionService } from "../services/productComposition.service";
import type { OptionGroup } from "../types/optionGroup";

interface DeleteOptionGroupDialogProps {
  optionGroup: OptionGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteOptionGroupDialog({
  optionGroup,
  open,
  onOpenChange,
  onDeleted,
}: DeleteOptionGroupDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);
      await productCompositionService.deleteOptionGroup(optionGroup.id);
      toast.success("Grupo excluído com sucesso.");
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir grupo:", error);
      toast.error("Não foi possível excluir o grupo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Excluir grupo</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir{" "}
            <strong>{optionGroup.name}</strong>? As opções vinculadas também
            serão removidas.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            {loading ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
