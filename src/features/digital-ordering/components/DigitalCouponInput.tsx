import { useState } from "react";
import { Tag } from "lucide-react";
import { toast } from "sonner";

interface DigitalCouponInputProps {
  onApply: (code: string) => { success: boolean; error?: string };
  onRemove: () => void;
  activeCode?: string | null;
}

export default function DigitalCouponInput({
  onApply,
  onRemove,
  activeCode,
}: DigitalCouponInputProps) {
  const [code, setCode] = useState("");

  const handleApply = () => {
    const result = onApply(code);
    if (!result.success) {
      toast.error(result.error ?? "Cupom inválido.");
      return;
    }
    toast.success("Cupom aplicado.");
    setCode("");
  };

  if (activeCode) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
        <span className="flex items-center gap-2 text-emerald-200">
          <Tag className="h-4 w-4" />
          Cupom {activeCode} aplicado
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-emerald-100 underline"
        >
          Remover
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        value={code}
        onChange={(event) => setCode(event.target.value.toUpperCase())}
        placeholder="Cupom promocional"
        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/30"
      />
      <button
        type="button"
        onClick={handleApply}
        className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium"
      >
        Aplicar
      </button>
    </div>
  );
}
