import { supabase } from "@/config/supabase";
import type {
  CreateFinancialTransactionDTO,
  FinancialTransaction,
} from "../types/finance";

export interface FinanceFilters {
  startDate?: string;
  endDate?: string;
  type?: FinancialTransaction["type"];
}

async function enrichTransactionsWithCustomers(
  transactions: FinancialTransaction[]
) {
  const saleIds = transactions
    .filter(
      (transaction) =>
        transaction.source === "pdv" && Boolean(transaction.reference_id)
    )
    .map((transaction) => transaction.reference_id as string);

  if (saleIds.length === 0) return transactions;

  const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select("id, customer_id")
    .in("id", saleIds);

  if (salesError) throw salesError;

  const customerIds = [
    ...new Set(
      (sales ?? [])
        .map((sale) => sale.customer_id)
        .filter((customerId): customerId is string => Boolean(customerId))
    ),
  ];

  const customerNameById = new Map<string, string>();

  if (customerIds.length > 0) {
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id, name")
      .in("id", customerIds);

    if (customersError) throw customersError;

    for (const customer of customers ?? []) {
      customerNameById.set(customer.id, customer.name);
    }
  }

  const customerNameBySaleId = new Map<string, string | null>();

  for (const sale of sales ?? []) {
    customerNameBySaleId.set(
      sale.id,
      sale.customer_id
        ? customerNameById.get(sale.customer_id) ?? null
        : null
    );
  }

  return transactions.map((transaction) => ({
    ...transaction,
    customer_name: transaction.reference_id
      ? customerNameBySaleId.get(transaction.reference_id) ?? null
      : null,
  }));
}

export async function getFinancialTransactions(filters: FinanceFilters = {}) {
  let query = supabase
    .from("financial_transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.startDate) {
    query = query.gte("transaction_date", filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte("transaction_date", filters.endDate);
  }

  if (filters.type) {
    query = query.eq("type", filters.type);
  }

  const { data, error } = await query;

  if (error) throw error;

  return enrichTransactionsWithCustomers(data as FinancialTransaction[]);
}

export async function createFinancialTransaction(
  payload: CreateFinancialTransactionDTO
) {
  const { data, error } = await supabase
    .from("financial_transactions")
    .insert({
      ...payload,
      source: "manual",
    })
    .select()
    .single();

  if (error) throw error;

  return data as FinancialTransaction;
}

export async function deleteFinancialTransaction(id: string) {
  const { error } = await supabase
    .from("financial_transactions")
    .delete()
    .eq("id", id)
    .eq("source", "manual");

  if (error) throw error;
}
