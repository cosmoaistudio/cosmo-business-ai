import {
  createFinancialTransaction,
  deleteFinancialTransaction,
  getFinancialTransactions,
  type FinanceFilters,
} from "../repository/finance.repository";
import type {
  CreateFinancialTransactionDTO,
  FinanceReportData,
} from "../types/finance";
import {
  buildCashFlow,
  computeFinanceStats,
  filterTransactionsByPeriod,
} from "../utils/financeStats";

function buildPeriodLabel(startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return `${startDate} até ${endDate}`;
  }

  if (startDate) {
    return `A partir de ${startDate}`;
  }

  if (endDate) {
    return `Até ${endDate}`;
  }

  return "Todo o período";
}

export const financeService = {
  async getTransactions(filters: FinanceFilters = {}) {
    return await getFinancialTransactions(filters);
  },

  async createTransaction(payload: CreateFinancialTransactionDTO) {
    return await createFinancialTransaction(payload);
  },

  async deleteTransaction(id: string) {
    return await deleteFinancialTransaction(id);
  },

  async getReport(filters: FinanceFilters = {}): Promise<FinanceReportData> {
    const transactions = await getFinancialTransactions(filters);
    const filtered = filterTransactionsByPeriod(
      transactions,
      filters.startDate,
      filters.endDate
    );

    const stats = computeFinanceStats(filtered);

    return {
      periodLabel: buildPeriodLabel(filters.startDate, filters.endDate),
      stats,
      transactions: filtered,
      cashFlow: buildCashFlow(filtered),
    };
  },
};
