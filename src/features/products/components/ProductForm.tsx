import { useState } from "react";
import { toast } from "sonner";
import { createProduct } from "../repository/products.repository";

interface ProductFormProps {
  onSuccess?: () => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    status: "active",
  });

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    setForm((old) => ({
      ...old,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.warning("Informe o nome do produto.");
      return;
    }

    try {
      setLoading(true);

      await createProduct({
        name: form.name,
        category: form.category,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        image: "",
        status: form.status as "active" | "inactive",
      });

      toast.success("Produto salvo com sucesso!");

      setForm({
        name: "",
        category: "",
        price: "",
        stock: "",
        description: "",
        status: "active",
      });

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Nome do produto"
        className="w-full rounded-xl border p-3"
      />

      <input
        name="category"
        value={form.category}
        onChange={handleChange}
        placeholder="Categoria"
        className="w-full rounded-xl border p-3"
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          name="price"
          type="number"
          value={form.price}
          onChange={handleChange}
          placeholder="Preço"
          className="rounded-xl border p-3"
        />

        <input
          name="stock"
          type="number"
          value={form.stock}
          onChange={handleChange}
          placeholder="Estoque"
          className="rounded-xl border p-3"
        />
      </div>

      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="w-full rounded-xl border p-3"
      >
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
      </select>

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Descrição do produto"
        rows={4}
        className="w-full rounded-xl border p-3"
      />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onSuccess}
          className="rounded-xl border px-5 py-3 hover:bg-slate-100"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 font-semibold text-white transition hover:scale-105 disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar Produto"}
        </button>
      </div>
    </div>
  );
}