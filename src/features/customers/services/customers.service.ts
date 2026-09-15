import { emitAutomationEvent } from "@/lib/automation-events";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  getCustomerPurchaseHistory,
  getCustomersOverview,
  getCustomersPaginated,
  searchCustomers,
  updateCustomer,
  type CreateCustomerDTO,
  type CustomersQueryParams,
  type UpdateCustomerDTO,
} from "../repository/customers.repository";

export const customersService = {
  getPaginated(params: CustomersQueryParams = {}) {
    return getCustomersPaginated(params);
  },

  getAll() {
    return getAllCustomers();
  },

  getById(id: string) {
    return getCustomerById(id);
  },

  getOverview() {
    return getCustomersOverview();
  },

  getPurchaseHistory(customerId: string) {
    return getCustomerPurchaseHistory(customerId);
  },

  search(search: string, limit = 20) {
    return searchCustomers(search, limit);
  },

  async create(payload: CreateCustomerDTO) {
    const customer = await createCustomer(payload);

    emitAutomationEvent("CUSTOMER_CREATED", {
      module: "customers",
      customerId: customer.id,
      customerName: customer.name,
      entityId: customer.id,
      entityType: "customer",
    });

    return customer;
  },

  async update(id: string, payload: UpdateCustomerDTO) {
    const customer = await updateCustomer(id, payload);

    emitAutomationEvent("CUSTOMER_UPDATED", {
      module: "customers",
      customerId: customer.id,
      customerName: customer.name,
      entityId: customer.id,
      entityType: "customer",
    });

    return customer;
  },

  async delete(id: string) {
    const customer = await getCustomerById(id);
    await deleteCustomer(id);

    emitAutomationEvent("CUSTOMER_INACTIVE", {
      module: "customers",
      customerId: id,
      customerName: customer?.name ?? "",
      entityId: id,
      entityType: "customer",
    });
  },
};

export type { CreateCustomerDTO, UpdateCustomerDTO };
