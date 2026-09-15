import { useEffect, useState } from "react";
import { toast } from "sonner";
import { emitDataChanged } from "@/lib/sale-events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customersService } from "../services/customers.service";
import type { CreateCustomerDTO } from "../repository/customers.repository";
import type { Customer } from "../types/customer";
import { formatCpf, isValidCpf, normalizeCpf } from "../utils/cpf";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CustomerFormState {
  name: string;
  phone: string;
  cpf: string;
  email: string;
  birth_date: string;
  address: string;
  notes: string;
}

const emptyForm: CustomerFormState = {
  name: "",
  phone: "",
  cpf: "",
  email: "",
  birth_date: "",
  address: "",
  notes: "",
};

function customerToForm(customer: Customer): CustomerFormState {
  return {
    name: customer.name,
    phone: customer.phone ?? "",
    cpf: customer.cpf ? formatCpf(customer.cpf) : "",
    email: customer.email ?? "",
    birth_date: customer.birth_date ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
  };
}

export default function CustomerForm({
  customer,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const isEditing = Boolean(customer);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(
    customer ? customerToForm(customer) : emptyForm
  );

  useEffect(() => {
    setForm(customer ? customerToForm(customer) : emptyForm);
  }, [customer]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: name === "cpf" ? formatCpf(value) : value,
    }));
  }

  function buildPayload(): CreateCustomerDTO {
    return {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      cpf: form.cpf ? normalizeCpf(form.cpf) : null,
      email: form.email.trim() || null,
      birth_date: form.birth_date || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }

    if (form.cpf && !isValidCpf(form.cpf)) {
      toast.error("CPF inválido");
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload();

      if (isEditing && customer) {
        await customersService.update(customer.id, payload);
        toast.success("Cliente atualizado com sucesso");
      } else {
        await customersService.create(payload);
        toast.success("Cliente cadastrado com sucesso");
      }

      emitDataChanged();
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar cliente"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="customer-name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nome *
        </label>
        <Input
          id="customer-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Nome completo"
          className="rounded-xl"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="customer-phone"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Telefone
          </label>
          <Input
            id="customer-phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="(11) 99999-9999"
            className="rounded-xl"
          />
        </div>

        <div>
          <label
            htmlFor="customer-cpf"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            CPF
          </label>
          <Input
            id="customer-cpf"
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            placeholder="000.000.000-00"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="customer-email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            E-mail
          </label>
          <Input
            id="customer-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="cliente@email.com"
            className="rounded-xl"
          />
        </div>

        <div>
          <label
            htmlFor="customer-birth-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Data de nascimento
          </label>
          <Input
            id="customer-birth-date"
            name="birth_date"
            type="date"
            value={form.birth_date}
            onChange={handleChange}
            className="rounded-xl"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="customer-address"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Endereço
        </label>
        <Input
          id="customer-address"
          name="address"
          value={form.address}
          onChange={handleChange}
          placeholder="Rua, número, bairro, cidade"
          className="rounded-xl"
        />
      </div>

      <div>
        <label
          htmlFor="customer-notes"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Observações
        </label>
        <textarea
          id="customer-notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Preferências, restrições, histórico relevante..."
          className="cosmo-input w-full p-3 text-sm"
        />
      </div>

      <div className="cosmo-modal-actions">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="cosmo-btn-cancel"
          >
            Cancelar
          </Button>
        )}

        <Button type="submit" disabled={loading}>
          {loading
            ? "Salvando..."
            : isEditing
              ? "Salvar alterações"
              : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
