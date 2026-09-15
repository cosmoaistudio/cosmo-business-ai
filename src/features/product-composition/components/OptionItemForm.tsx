import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { productCompositionService } from "../services/productComposition.service";
import { compositionAdminService } from "../services/compositionAdmin.service";
import type { CreateCompositionOptionDTO } from "../types/option";
import type { CompositionOptionWithGroup } from "../types/option";
import type { OptionGroup } from "../types/optionGroup";
import { resolveOptionImage } from "../utils/optionImage";
import OptionImageUpload from "./OptionImageUpload";

interface OptionItemFormProps {
  option?: CompositionOptionWithGroup;
  groups: OptionGroup[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface OptionItemFormState {
  group_id: string;
  name: string;
  description: string;
  price: string;
  stock_control: boolean;
  stock: string;
  active: boolean;
  sort_order: string;
  image_url: string;
}

const emptyForm: OptionItemFormState = {
  group_id: "",
  name: "",
  description: "",
  price: "0",
  stock_control: false,
  stock: "0",
  active: true,
  sort_order: "0",
  image_url: "",
};

function optionToForm(option: CompositionOptionWithGroup): OptionItemFormState {
  return {
    group_id: option.group_id,
    name: option.name,
    description: option.description ?? "",
    price: String(option.price),
    stock_control: option.stock_control,
    stock: String(option.stock),
    active: option.active,
    sort_order: String(option.sort_order),
    image_url: resolveOptionImage(option),
  };
}

function buildPayload(form: OptionItemFormState): CreateCompositionOptionDTO {
  return {
    group_id: form.group_id,
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: Number(form.price) || 0,
    stock_control: form.stock_control,
    stock: form.stock_control ? Number(form.stock) || 0 : 0,
    active: form.active,
    sort_order: Number(form.sort_order) || 0,
    image_url: form.image_url.trim() || null,
  };
}

export default function OptionItemForm({
  option,
  groups,
  onSuccess,
  onCancel,
}: OptionItemFormProps) {
  const { profile, session, loading: authLoading } = useAuth();
  const isEditing = Boolean(option);
  const draftOptionId = useMemo(() => crypto.randomUUID(), []);
  const optionId = option?.id ?? draftOptionId;
  const organizationId = profile?.organization_id ?? "";

  const [loading, setLoading] = useState(false);
  const [impactCount, setImpactCount] = useState(0);
  const [form, setForm] = useState<OptionItemFormState>(
    option ? optionToForm(option) : emptyForm
  );

  useEffect(() => {
    setForm(option ? optionToForm(option) : emptyForm);
  }, [option]);

  useEffect(() => {
    let cancelled = false;
    if (!option?.id) {
      setImpactCount(0);
      return;
    }

    void compositionAdminService
      .getOptionImpact(option.id)
      .then((impact) => {
        if (!cancelled) setImpactCount(impact.productCount);
      })
      .catch(() => {
        if (!cancelled) setImpactCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [option?.id]);

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
    }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.warning("Informe o nome do item.");
      return;
    }

    if (!form.group_id) {
      toast.warning("Selecione um grupo.");
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload(form);

      if (option) {
        const impact = await compositionAdminService.getOptionImpact(option.id);
        if (impact.productCount > 1) {
          const confirmed = window.confirm(
            `Alterar "${option.name}" globalmente?\n\n` +
              `Esta opção está sendo utilizada em ${impact.productCount} produtos.\n` +
              `A alteração afetará todos eles.\n\n` +
              `OK = Alterar globalmente\nCancelar = Abortar\n\n` +
              `Dica: use "Duplicar opção" se quiser uma versão independente.`
          );
          if (!confirmed) {
            setLoading(false);
            return;
          }
        }

        await productCompositionService.updateOption(option.id, payload);
        toast.success("Item atualizado com sucesso!");
      } else {
        await productCompositionService.createOption(payload);
        toast.success("Item cadastrado com sucesso!");
        setForm(emptyForm);
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar item de opção:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o item.";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {isEditing && impactCount > 1 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Esta opção está sendo utilizada em{" "}
          <strong>{impactCount} produtos</strong>. Alterações afetam todos eles.
          Use <strong>Duplicar opção</strong> para criar uma versão independente.
        </div>
      )}

      <OptionImageUpload
        optionId={optionId}
        organizationId={organizationId}
        imageUrl={form.image_url || undefined}
        disabled={loading || authLoading || !organizationId || !session}
        persistToDatabase={isEditing}
        onUploaded={(publicUrl) =>
          setForm((current) => ({ ...current, image_url: publicUrl }))
        }
        onRemoved={() => setForm((current) => ({ ...current, image_url: "" }))}
      />

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-600">
          Grupo
        </label>
        <select
          name="group_id"
          value={form.group_id}
          onChange={handleChange}
          disabled={isEditing}
          className="cosmo-input w-full p-3 disabled:bg-slate-100"
        >
          <option value="">Selecione um grupo</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Nome do item"
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
            Preço adicional
          </label>
          <input
            name="price"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={handleChange}
            className="cosmo-input w-full p-3"
          />
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

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          name="stock_control"
          type="checkbox"
          checked={form.stock_control}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-slate-700">
          Controla estoque deste item
        </span>
      </label>

      {form.stock_control && (
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-600">
            Estoque
          </label>
          <input
            name="stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={handleChange}
            className="cosmo-input w-full p-3"
          />
        </div>
      )}

      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          name="active"
          type="checkbox"
          checked={form.active}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-slate-700">
          Item ativo para seleção
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

        {option && (
          <button
            type="button"
            disabled={loading}
            className="rounded-xl border border-violet-300 px-5 py-3 text-violet-700 disabled:opacity-50"
            onClick={async () => {
              try {
                setLoading(true);
                await compositionAdminService.duplicateOption(option.id);
                toast.success("Opção duplicada (cópia independente no grupo).");
                onSuccess?.();
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Falha ao duplicar opção."
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            Duplicar opção
          </button>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
        >
          {loading
            ? "Salvando..."
            : isEditing
              ? "Atualizar Item"
              : "Salvar Item"}
        </button>
      </div>
    </div>
  );
}
