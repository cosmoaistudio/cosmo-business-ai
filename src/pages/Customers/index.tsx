import { useState } from "react";
import CustomersHeader from "@/components/customers/CustomersHeader";
import CustomersStats from "@/components/customers/stats/CustomersStats";
import CustomersTable from "@/components/customers/table/CustomersTable";
import {
  CustomerDetailModal,
  CustomerModal,
  CustomerSearch,
  DeleteCustomerDialog,
  useCustomers,
  type CustomerWithStats,
} from "@/features/customers";
import { AnimatedPage, AnimatedSection } from "@/motion";

export default function Customers() {
  const {
    customers,
    overview,
    loading,
    search,
    setSearch,
    page,
    setPage,
    total,
    totalPages,
    reload,
  } = useCustomers();

  const [viewingCustomer, setViewingCustomer] =
    useState<CustomerWithStats | null>(null);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerWithStats | null>(null);
  const [deletingCustomer, setDeletingCustomer] =
    useState<CustomerWithStats | null>(null);

  return (
    <AnimatedPage className="space-y-8">
      <AnimatedSection>
        <CustomersHeader reload={reload} />
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <CustomersStats overview={overview} loading={loading} />
      </AnimatedSection>

      <AnimatedSection delay={0.08}>
        <CustomerSearch value={search} onChange={setSearch} />
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <CustomersTable
          customers={customers}
          loading={loading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
          onView={setViewingCustomer}
          onEdit={setEditingCustomer}
          onDelete={setDeletingCustomer}
        />
      </AnimatedSection>

      {viewingCustomer && (
        <CustomerDetailModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}

      {editingCustomer && (
        <CustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSaved={reload}
        />
      )}

      {deletingCustomer && (
        <DeleteCustomerDialog
          customer={deletingCustomer}
          open={Boolean(deletingCustomer)}
          onOpenChange={(open) => {
            if (!open) setDeletingCustomer(null);
          }}
          onDeleted={reload}
        />
      )}
    </AnimatedPage>
  );
}
