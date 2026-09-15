export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  cpf?: string | null;
  email?: string | null;
  birth_date?: string | null;
  address?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CustomerSalesStats {
  purchaseCount: number;
  totalSpent: number;
  lastPurchaseAt?: string | null;
}

export interface CustomerWithStats extends Customer, CustomerSalesStats {}

export interface CustomerOverviewStats {
  totalCustomers: number;
  customersWithPurchases: number;
  totalRevenue: number;
  newCustomersToday: number;
}

export interface CustomerPurchase {
  id: string;
  sale_number: number;
  total: number;
  discount: number;
  created_at: string;
  observation?: string | null;
  items: CustomerPurchaseItem[];
  payment_method?: string;
}

export interface CustomerPurchaseItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  options?: CustomerPurchaseItemOption[];
}

export interface CustomerPurchaseItemOption {
  option_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface PaginatedCustomers {
  data: CustomerWithStats[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CustomersQueryParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export type CreateCustomerDTO = Omit<
  Customer,
  "id" | "created_at" | "updated_at"
>;

export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;
