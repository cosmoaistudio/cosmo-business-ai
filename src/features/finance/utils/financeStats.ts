import { isSameLocalDay } from "@/lib/date";
import type {
  CashFlowPoint,
  FinanceStats,
  FinancialTransaction,
} from "../types/finance";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function isToday(dateString: string) {
  // transaction_date is stored as YYYY-MM-DD
  return isSameLocalDay(`${dateString}T12:00:00`);
}

function formatDayLabel(date: Date) {
  return DAY_LABELS[date.getDay()];
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sumByType(
  transactions: FinancialTransaction[],
  type: FinancialTransaction["type"]
) {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
}

export function computeFinanceStats(
  transactions: FinancialTransaction[]
): FinanceStats {
  const totalIncome = sumByType(transactions, "income");
  const totalExpenses = sumByType(transactions, "expense");
  const todayTransactions = transactions.filter((transaction) =>
    isToday(transaction.transaction_date)
  );

  const incomeToday = sumByType(todayTransactions, "income");
  const expensesToday = sumByType(todayTransactions, "expense");

  return {
    totalIncome,
    totalExpenses,
    profit: totalIncome - totalExpenses,
    balance: totalIncome - totalExpenses,
    incomeToday,
    expensesToday,
    profitToday: incomeToday - expensesToday,
    transactionCount: transactions.length,
  };
}

export function buildCashFlow(
  transactions: FinancialTransaction[],
  days = 7
): CashFlowPoint[] {
  const points: CashFlowPoint[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);

    const dateKey = toDateKey(date);
    const dayTransactions = transactions.filter(
      (transaction) => transaction.transaction_date === dateKey
    );

    const income = sumByType(dayTransactions, "income");
    const expenses = sumByType(dayTransactions, "expense");

    points.push({
      date: dateKey,
      label: formatDayLabel(date),
      income,
      expenses,
      balance: income - expenses,
    });
  }

  return points;
}

export function filterTransactionsByPeriod(
  transactions: FinancialTransaction[],
  startDate?: string,
  endDate?: string
) {
  return transactions.filter((transaction) => {
    if (startDate && transaction.transaction_date < startDate) return false;
    if (endDate && transaction.transaction_date > endDate) return false;
    return true;
  });
}
