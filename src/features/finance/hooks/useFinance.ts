import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { onDataChanged } from "@/lib/sale-events";
import { financeService } from "../services/finance.service";
import type { FinanceFilters } from "../repository/finance.repository";
import type {
  CashFlowPoint,
  FinanceStats,
  FinancialTransaction,
} from "../types/finance";
import { buildCashFlow, computeFinanceStats } from "../utils/financeStats";

const EMPTY_STATS: FinanceStats = {
  totalIncome: 0,
  totalExpenses: 0,
  profit: 0,
  balance: 0,
  incomeToday: 0,
  expensesToday: 0,
  profitToday: 0,
  transactionCount: 0,
};

export function useFinance(filters: FinanceFilters = {}) {
  const { startDate, endDate, type } = filters;
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [stats, setStats] = useState<FinanceStats>(EMPTY_STATS);
  const [cashFlow, setCashFlow] = useState<CashFlowPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      const requestFilters: FinanceFilters = { startDate, endDate, type };
      const data = await financeService.getTransactions(requestFilters);
      setTransactions(data);
      setStats(computeFinanceStats(data));
      setCashFlow(buildCashFlow(data));
    } catch (error) {
      logger.error("Erro ao carregar financeiro:", error);
      toast.error("Não foi possível carregar o financeiro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, type]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    return onDataChanged(reload);
  }, [reload]);

  return {
    transactions,
    stats,
    cashFlow,
    loading,
    reload,
  };
}
