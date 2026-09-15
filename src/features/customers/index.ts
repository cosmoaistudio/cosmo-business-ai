export * from "./repository/customers.repository";
export * from "./services/customers.service";
export * from "./hooks/useCustomers";
export * from "./hooks/useCustomerSales";
export * from "./hooks/useCustomerSearch";
export * from "./utils/customerStats";
export * from "./utils/cpf";

export type {
  Customer,
  CustomerWithStats,
  CustomerOverviewStats,
  CustomerPurchase,
  PaginatedCustomers,
} from "./types/customer";

export { default as CustomerForm } from "./components/CustomerForm";
export { default as CustomerModal } from "./components/CustomerModal";
export { default as CustomerSearch } from "./components/CustomerSearch";
export { default as CustomerDetailModal } from "./components/CustomerDetailModal";
export { default as CustomerPurchaseHistory } from "./components/CustomerPurchaseHistory";
export { default as CustomerSelector } from "./components/CustomerSelector";
export { default as DeleteCustomerDialog } from "./components/DeleteCustomerDialog";
