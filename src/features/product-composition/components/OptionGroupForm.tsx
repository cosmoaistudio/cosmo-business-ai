import { useEffect, useState } from "react";
import { toast } from "sonner";
import { compositionAdminService } from "../services/compositionAdmin.service";
import { productCompositionService } from "../services/productComposition.service";
import type { CreateOptionGroupDTO, OptionGroup } from "../types/optionGroup";

interface OptionGroupFormProps {
  optionGroup?: OptionGroup;
  onSuccess?: (group: OptionGroup) => void;
  onCancel?: () => void;
}

interface OptionGroupFormState {
  name: string;
  description: string;
  selection_type: OptionGroup["selection_type"];
  min_selection: string;
  max_selection: string;
  required: boolean;
  sort_order: string;
}

const emptyForm: OptionGroupFormState = {
  name: "",
  description: "",
  selection_type: "checkbox",
  min_selection: "0",
  max_selection: "1",
  required: false,
  sort_order: "0",
};

function optionGroupToForm(optionGroup: OptionGroup): OptionGroupFormState {
  return {
    name: optionGroup.name,
    description: optionGroup.description ?? "",
    selection_type: optionGroup.selection_type,
    min_selection: String(optionGroup.min_selection),
    max_selection: String(optionGroup.max_selection),
    required: optionGroup.required,
    sort_order: String(optionGroup.sort_order),
  };
}

function buildPayload(form: OptionGroupFormState): CreateOptionGroupDTO {
  const selectionType = form.selection_type;
  const minSelection = Number(form.min_selection) || 0;
  const maxSelection =
    selectionType === "radio" ? 1 : Number(form.max_selection) || 0;

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    selection_type: selectionType,
    min_selection: minSelection,
    max_selection: maxSelection,
    required: form.required,
    sort_order: Number(form.sort_order) || 0,
  };
}

export default function OptionGroupForm({
  optionGroup,
  onSuccess,
  onCancel,
}: OptionGroupFormProps) {
  const isEditing = Boolean(optionGroup);
  const [loading, setLoading] = useState(false);
  const [sharedProductCount, setSharedProductCount] = useState(0);
  const [sharedProductNames, setSharedProductNames] = useState<string[]>([]);
  const [form, setForm] = useState<OptionGroupFormState>(
    optionGroup ? optionGroupToForm(optionGroup) : emptyForm
  );

  useEffect(() => {
    setForm(optionGroup ? optionGroupToForm(optionGroup) : emptyForm);
  }, [optionGroup]);

  useEffect(() => {
    let cancelled = false;
    if (!optionGroup?.id) {
      setSharedProductCount(0);
      setSharedProductNames([]);
      return;
    }

    void compositionAdminService
      .getGroupImpact(optionGroup.id)
      .then((impact) => {
        if (cancelled) return;
        setSharedProductCount(impact.productCount);
        setSharedProductNames(impact.products.map((p) => p.name));
      })
      .catch(() => {
        if (!cancelled) {
          setSharedProductCount(0);
          setSharedProductNames([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [optionGroup?.id]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = event.target;
    const checked =
      event.target instanceof HTMLInputElement ? event.target.checked : false;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "selection_type" && value === "radio"
        ? { max_selection: "1" }
        : {}),
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.warning("Informe o nome do grupo.");
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload(form);

      if (optionGroup) {
        const updated = await productCompositionService.updateOptionGroup(
          optionGroup.id,
          payload
        );
        toast.success("Grupo atualizado com sucesso!");
        onSuccess?.(updated);
      } else {
        const created = await productCompositionService.createOptionGroup(payload);
        toast.success("Grupo cadastrado com sucesso!");
        onSuccess?.(created);
      }
    } catch (error) {
      console.error("Erro ao salvar grupo de opções:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o grupo.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {isEditing && sharedProductCount > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p className="font-semibold">
            Grupo compartilhado — usado em {sharedProductCount} produto(s)
          </p>
          <p className="mt-1">
            Alterar este grupo afeta todos os produtos vinculados
            {sharedProductNames.length > 0
              ? `: ${sharedProductNames.slice(0, 5).join(", ")}${
                  sharedProductNames.length > 5 ? "…" : ""
                }`
              : "."}
          </p>
          <p className="mt-1 text-amber-800">
            Para mudar só um produto, use duplicação com cópia independente.
          </p>
        </div>
      )}

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Nome do grupo"
        className="cosmo-input w-full p-3"
      />

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Descrição"
        rows={3}
        className="cosmo-input w-full p-3"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Tipo de seleção
          </label>
          <select
            name="selection_type"
            value={form.selection_type}
            onChange={handleChange}
            className="cosmo-input w-full p-3"
          >
            <option value="checkbox">Checkbox</option>
            <option value="radio">Radio</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Ordem
          </label>
          <input
            name="sort_order"
            type="number"
            min={0}
            value={form.sort_order}
            onChange={handleChange}
            className="cosmo-input w-full p-3"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Quantidade mínima
          </label>
          <input
            name="min_selection"
            type="number"
            min={0}
            value={form.min_selection}
            onChange={handleChange}
            className="cosmo-input w-full p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Quantidade máxima
          </label>
          <input
            name="max_selection"
            type="number"
            min={0}
            value={form.max_selection}
            onChange={handleChange}
            disabled={form.selection_type === "radio"}
            className="cosmo-input w-full p-3 disabled:bg-slate-100"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          name="required"
          type="checkbox"
          checked={form.required}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-slate-700">
          Grupo obrigatório na composição do produto
        </span>
      </label>

      <div className="cosmo-modal-actions">
        <button
          type="button"
          onClick={onCancel}
          className="cosmo-btn-cancel rounded-xl border px-5 py-3"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
        >
          {loading
            ? "Salvando..."
            : isEditing
              ? "Atualizar Grupo"
              : "Salvar Grupo"}
        </button>
      </div>
    </div>
  );
}
