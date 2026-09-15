import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  CashFlowChart,
  DeleteTransactionDialog,
  FinanceReportsPanel,
  FinanceStatsGrid,
  TransactionDialog,
  TransactionsTable,
  useFinance,
  useFinanceTransaction,
  type FinancialCategory,
  type FinancialTransaction,
  type FinancialTransactionType,
} from "@/features/finance";
import { AnimatedPage, AnimatedSection } from "@/motion";

export default function Finance() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<FinancialTransaction | null>(null);
  const [transactionType, setTransactionType] =
    useState<FinancialTransactionType>("income");

  const filters = useMemo(
    () => ({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [startDate, endDate]
  );

  const { transactions, stats, cashFlow, loading, reload } =
    useFinance(filters);
  const { createTransaction, deleteTransaction, loading: saving } =
    useFinanceTransaction();

  function openDialog(type: FinancialTransactionType) {
    setTransactionType(type);
    setDialogOpen(true);
  }

  async function handleCreateTransaction(params: {
    type: FinancialTransactionType;
    category: FinancialCategory;
    description: string;
    amount: number;
    transaction_date: string;
    notes?: string;
  }) {
    await createTransaction(params, () => {
      setDialogOpen(false);
      reload();
    });
  }

  function openDeleteDialog(transaction: FinancialTransaction) {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteTransaction(transaction: FinancialTransaction) {
    await deleteTransaction(transaction.id, reload);
    setTransactionToDelete(null);
  }

  return (
    <AnimatedPage className="space-y-8">
      <PageHeader
        title="Financeiro"
        subtitle="Fluxo de caixa, entradas, despesas, lucro e relatórios integrados ao banco."
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => openDialog("expense")}
            >
              <ArrowDownCircle size={16} />
              Nova despesa
            </Button>

            <Button className="rounded-xl" onClick={() => openDialog("income")}>
              <ArrowUpCircle size={16} />
              Nova entrada
            </Button>
          </div>
        }
      />

      <AnimatedSection delay={0.05}>
        <FinanceStatsGrid stats={stats} loading={loading} />
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <CashFlowChart data={cashFlow} loading={loading} />
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <TransactionsTable
            transactions={transactions}
            loading={loading}
            onDelete={openDeleteDialog}
          />

          <FinanceReportsPanel
            stats={stats}
            filters={filters}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      </AnimatedSection>

      <TransactionDialog
        open={dialogOpen}
        transactionType={transactionType}
        loading={saving}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleCreateTransaction}
      />

      <DeleteTransactionDialog
        transaction={transactionToDelete}
        open={deleteDialogOpen}
        loading={saving}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTransaction}
      />
    </AnimatedPage>
  );
}
