export type FinancialTransactionType = "income" | "expense";

export type FinancialTransactionSource = "manual" | "pdv" | "system" | "digital_ordering";

export type IncomeCategory =
  | "sale"
  | "service"
  | "investment"
  | "other_income";

export type ExpenseCategory =
  | "rent"
  | "salary"
  | "utilities"
  | "supplies"
  | "marketing"
  | "tax"
  | "other_expense";

export type FinancialCategory = IncomeCategory | ExpenseCategory;

export interface FinancialTransaction {
  id: string;
  type: FinancialTransactionType;
  category: FinancialCategory;
  description: string;
  amount: number;
  transaction_date: string;
  source: FinancialTransactionSource;
  reference_id?: string | null;
  notes?: string | null;
  customer_name?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateFinancialTransactionDTO {
  type: FinancialTransactionType;
  category: FinancialCategory;
  description: string;
  amount: number;
  transaction_date: string;
  notes?: string;
}

export interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  balance: number;
  incomeToday: number;
  expensesToday: number;
  profitToday: number;
  transactionCount: number;
}

export interface CashFlowPoint {
  date: string;
  label: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface FinanceReportData {
  periodLabel: string;
  stats: FinanceStats;
  transactions: FinancialTransaction[];
  cashFlow: CashFlowPoint[];
}

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  sale: "Venda",
  service: "Serviço",
  investment: "Investimento",
  other_income: "Outras entradas",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: "Aluguel",
  salary: "Salários",
  utilities: "Utilidades",
  supplies: "Insumos",
  marketing: "Marketing",
  tax: "Impostos",
  other_expense: "Outras despesas",
};

export const TRANSACTION_TYPE_LABELS: Record<FinancialTransactionType, string> = {
  income: "Entrada",
  expense: "Saída",
};

export const TRANSACTION_SOURCE_LABELS: Record<
  FinancialTransactionSource,
  string
> = {
  manual: "Manual",
  pdv: "PDV",
  system: "Sistema",
  digital_ordering: "Pedido Digital",
};

export function getCategoryLabel(category: FinancialCategory) {
  if (category in INCOME_CATEGORY_LABELS) {
    return INCOME_CATEGORY_LABELS[category as IncomeCategory];
  }

  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory];
}
