import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StockAlert } from "../types/inventory";

interface MinStockDialogProps {
  alert: StockAlert | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (minStock: number) => void;
}

export default function MinStockDialog({
  alert,
  loading = false,
  onClose,
  onConfirm,
}: MinStockDialogProps) {
  const [minStock, setMinStock] = useState("");

  useEffect(() => {
    if (alert) {
      setMinStock(String(alert.minStock));
    }
  }, [alert]);

  const parsedMinStock = Number.parseInt(minStock, 10);
  const canConfirm =
    alert !== null &&
    !Number.isNaN(parsedMinStock) &&
    parsedMinStock >= 0 &&
    !loading;

  return (
    <Dialog
      open={Boolean(alert)}
      onOpenChange={(isOpen) => !isOpen && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Estoque mínimo</DialogTitle>
          <DialogDescription>
            Defina o estoque mínimo para{" "}
            <strong>{alert?.productName}</strong>. Alertas serão exibidos quando
            o estoque atual atingir ou ficar abaixo deste valor.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label
            htmlFor="min-stock"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Quantidade mínima
          </label>
          <Input
            id="min-stock"
            type="number"
            min={0}
            value={minStock}
            onChange={(event) => setMinStock(event.target.value)}
            className="rounded-xl"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button
            disabled={!canConfirm}
            onClick={() => onConfirm(parsedMinStock)}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
