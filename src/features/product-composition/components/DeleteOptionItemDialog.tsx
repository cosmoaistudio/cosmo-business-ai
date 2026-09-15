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
import type { CompositionOptionWithGroup } from "../types/option";

interface DeleteOptionItemDialogProps {
  option: CompositionOptionWithGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteOptionItemDialog({
  option,
  open,
  onOpenChange,
  onDeleted,
}: DeleteOptionItemDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);
      await productCompositionService.deleteOption(option.id);
      toast.success("Item excluído com sucesso.");
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      toast.error("Não foi possível excluir o item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Excluir item</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{option.name}</strong>?
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
