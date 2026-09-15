import { supabase } from "@/config/supabase";
import { normalizeCpf } from "../utils/cpf";
import {
  attachSalesStatsToCustomers,
  buildCustomersSalesStats,
  computeCustomerOverview,
} from "../utils/customerStats";
import type {
  CreateCustomerDTO,
  Customer,
  CustomerOverviewStats,
  CustomerPurchase,
  CustomersQueryParams,
  PaginatedCustomers,
  UpdateCustomerDTO,
} from "../types/customer";

const DEFAULT_PAGE_SIZE = 10;

function mapCustomer(customer: Customer): Customer {
  return {
    ...customer,
    phone: customer.phone ?? null,
    cpf: customer.cpf ?? null,
    email: customer.email ?? null,
    birth_date: customer.birth_date ?? null,
    address: customer.address ?? null,
    notes: customer.notes ?? null,
  };
}

function sanitizeCustomerPayload(payload: CreateCustomerDTO | UpdateCustomerDTO) {
  return {
    ...payload,
    name: payload.name?.trim(),
    phone: payload.phone?.trim() || null,
    cpf: payload.cpf ? normalizeCpf(payload.cpf) || null : null,
    email: payload.email?.trim() || null,
    birth_date: payload.birth_date || null,
    address: payload.address?.trim() || null,
    notes: payload.notes?.trim() || null,
  };
}

async function getCompletedSalesByCustomers(customerIds: string[]) {
  if (customerIds.length === 0) return [];

  const { data, error } = await supabase
    .from("sales")
    .select("customer_id, total, created_at")
    .eq("status", "completed")
    .in("customer_id", customerIds);

  if (error) throw error;

  return data ?? [];
}

async function getAllCompletedSalesWithCustomer() {
  const { data, error } = await supabase
    .from("sales")
    .select("customer_id, total, created_at")
    .eq("status", "completed")
    .not("customer_id", "is", null);

  if (error) throw error;

  return data ?? [];
}

export async function getCustomersPaginated(
  params: CustomersQueryParams = {}
): Promise<PaginatedCustomers> {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const search = params.search?.trim();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},phone.ilike.${term},cpf.ilike.${term},email.ilike.${term}`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;

  const customers = (data as Customer[]).map(mapCustomer);
  const customerIds = customers.map((customer) => customer.id);
  const sales = await getCompletedSalesByCustomers(customerIds);
  const statsMap = buildCustomersSalesStats(sales);

  const total = count ?? 0;

  return {
    data: attachSalesStatsToCustomers(customers, statsMap),
    total,
    page,
    pageSize,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
  };
}

export async function getAllCustomers() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data as Customer[]).map(mapCustomer);
}

export async function getCustomerById(id: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  const customer = mapCustomer(data as Customer);
  const sales = await getCompletedSalesByCustomers([customer.id]);
  const statsMap = buildCustomersSalesStats(sales);

  return attachSalesStatsToCustomers([customer], statsMap)[0];
}

export async function getCustomersOverview(): Promise<CustomerOverviewStats> {
  const [customersResult, customersTodayResult, sales] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("created_at"),
    getAllCompletedSalesWithCustomer(),
  ]);

  if (customersResult.error) throw customersResult.error;
  if (customersTodayResult.error) throw customersTodayResult.error;

  const today = new Date();
  const newCustomersToday = (customersTodayResult.data ?? []).filter(
    (customer) => {
      const createdAt = new Date(customer.created_at);
      return (
        createdAt.getFullYear() === today.getFullYear() &&
        createdAt.getMonth() === today.getMonth() &&
        createdAt.getDate() === today.getDate()
      );
    }
  ).length;

  return computeCustomerOverview(
    customersResult.count ?? 0,
    newCustomersToday,
    sales
  );
}

export async function createCustomer(payload: CreateCustomerDTO) {
  const { data, error } = await supabase
    .from("customers")
    .insert(sanitizeCustomerPayload(payload))
    .select()
    .single();

  if (error) throw error;

  return mapCustomer(data as Customer);
}

export async function updateCustomer(id: string, payload: UpdateCustomerDTO) {
  const { data, error } = await supabase
    .from("customers")
    .update({
      ...sanitizeCustomerPayload(payload),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapCustomer(data as Customer);
}

export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);

  if (error) throw error;
}

export async function getCustomerPurchaseHistory(
  customerId: string
): Promise<CustomerPurchase[]> {
  const { data, error } = await supabase
    .from("sales")
    .select(
      `
      id,
      sale_number,
      total,
      discount,
      created_at,
      observation,
      sale_items (
        product_name,
        quantity,
        unit_price,
        subtotal,
        sale_item_options (
          option_name,
          quantity,
          price,
          subtotal
        )
      ),
      sale_payments (
        payment_method
      )
    `
    )
    .eq("customer_id", customerId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((sale) => ({
    id: sale.id,
    sale_number: sale.sale_number,
    total: Number(sale.total),
    discount: Number(sale.discount ?? 0),
    created_at: sale.created_at,
    observation: sale.observation,
    items: (sale.sale_items ?? []).map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      subtotal: Number(item.subtotal),
      options: (item.sale_item_options ?? []).map((option) => ({
        option_name: option.option_name,
        quantity: option.quantity,
        price: Number(option.price),
        subtotal: Number(option.subtotal),
      })),
    })),
    payment_method: sale.sale_payments?.[0]?.payment_method,
  }));
}

export async function searchCustomers(search: string, limit = 20) {
  const term = search.trim();

  if (!term) {
    return getAllCustomers();
  }

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,cpf.ilike.%${term}%,email.ilike.%${term}%`
    )
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data as Customer[]).map(mapCustomer);
}

export type {
  CreateCustomerDTO,
  UpdateCustomerDTO,
  CustomersQueryParams,
} from "../types/customer";
export type { CustomerWithStats } from "../types/customer";
