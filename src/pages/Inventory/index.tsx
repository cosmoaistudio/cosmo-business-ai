import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { emitDataChanged } from "@/lib/sale-events";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  InventoryStatsGrid,
  MinStockDialog,
  MovementsTable,
  StockAlertsList,
  StockMovementDialog,
  useInventory,
  useStockMovement,
  type StockAlert,
  type StockMovementType,
} from "@/features/inventory";

export default function Inventory() {
  const { products, movements, alerts, stats, loading, reload } =
    useInventory();
  const { registerMovement, updateMinStock, loading: movementLoading } =
    useStockMovement();

  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] =
    useState<Extract<StockMovementType, "entry" | "exit">>("entry");
  const [editingAlert, setEditingAlert] = useState<StockAlert | null>(null);

  function openMovementDialog(type: Extract<StockMovementType, "entry" | "exit">) {
    setMovementType(type);
    setMovementDialogOpen(true);
  }

  async function handleRegisterMovement(params: {
    productId: string;
    quantity: number;
    notes?: string;
  }) {
    await registerMovement({
      productId: params.productId,
      movementType,
      quantity: params.quantity,
      notes: params.notes,
      onSuccess: () => {
        setMovementDialogOpen(false);
        reload();
        emitDataChanged();
      },
    });
  }

  async function handleUpdateMinStock(minStock: number) {
    if (!editingAlert) return;

    await updateMinStock(editingAlert.productId, minStock, () => {
      setEditingAlert(null);
      reload();
      emitDataChanged();
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Estoque"
        subtitle="Controle entradas, saídas, alertas e histórico de movimentações."
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => openMovementDialog("exit")}
            >
              <ArrowUpFromLine size={16} />
              Saída manual
            </Button>

            <Button
              className="rounded-xl"
              onClick={() => openMovementDialog("entry")}
            >
              <ArrowDownToLine size={16} />
              Entrada
            </Button>
          </div>
        }
      />

      <InventoryStatsGrid stats={stats} loading={loading} />

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <StockAlertsList
          alerts={alerts}
          loading={loading}
          onEditMinStock={setEditingAlert}
        />

        <MovementsTable movements={movements} loading={loading} />
      </div>

      <StockMovementDialog
        open={movementDialogOpen}
        movementType={movementType}
        products={products}
        loading={movementLoading}
        onClose={() => setMovementDialogOpen(false)}
        onConfirm={handleRegisterMovement}
      />

      <MinStockDialog
        alert={editingAlert}
        loading={movementLoading}
        onClose={() => setEditingAlert(null)}
        onConfirm={handleUpdateMinStock}
      />
    </div>
  );
}
