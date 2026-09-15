import { useState } from "react";
import { toast } from "sonner";
import { emitDataChanged } from "@/lib/sale-events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customersService } from "../services/customers.service";
import type { CustomerWithStats } from "../types/customer";

interface DeleteCustomerDialogProps {
  customer: CustomerWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export default function DeleteCustomerDialog({
  customer,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCustomerDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    try {
      setLoading(true);
      await customersService.delete(customer.id);
      toast.success("Cliente excluído com sucesso");
      emitDataChanged();
      onDeleted();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao excluir cliente"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>Excluir cliente</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{customer.name}</strong>?
            {customer.purchaseCount > 0 && (
              <>
                {" "}
                O histórico de {customer.purchaseCount} compra(s) será mantido,
                mas sem vínculo com este cliente.
              </>
            )}
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
