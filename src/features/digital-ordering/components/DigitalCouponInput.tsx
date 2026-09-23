import { Tag } from "lucide-react";
import { toast } from "sonner";
import type { MenuTheme } from "../menu/types/digitalMenu.types";
import {
  DEFAULT_MENU_THEME,
  radiusToCss,
  surfaceStyle,
} from "../menu/theme/menuTheme";

interface DigitalCouponInputProps {
  onApply: (code: string) => { success: boolean; error?: string };
  onRemove: () => void;
  activeCode?: string | null;
  theme?: MenuTheme;
}

/**
 * Campo preparado para cupons futuros.
 * Enquanto não houver validação server-side, não aplica desconto nem
 * apresenta cupom "ativo" — evita falsa expectativa no checkout público.
 */
export default function DigitalCouponInput({
  onApply,
  theme = DEFAULT_MENU_THEME,
}: DigitalCouponInputProps) {
  const handleApply = () => {
    const result = onApply("");
    toast.error(
      result.error ?? "Cupons promocionais estarão disponíveis em breve."
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 opacity-60">
        <div
          className="flex flex-1 items-center gap-2 border px-4 py-3 text-sm"
          style={{
            ...surfaceStyle(theme),
            color: theme.mutedTextColor,
          }}
        >
          <Tag className="h-4 w-4 shrink-0" aria-hidden />
          <span>Cupom promocional</span>
        </div>
        <button
          type="button"
          onClick={handleApply}
          className="digital-focus-ring border px-4 py-3 text-sm font-medium"
          style={{
            borderRadius: radiusToCss(theme.buttonRadius),
            borderColor: theme.borderColor,
            backgroundColor: theme.surfaceColor,
            color: theme.mutedTextColor,
          }}
        >
          Em breve
        </button>
      </div>
      <p className="text-xs" style={{ color: theme.mutedTextColor }}>
        Cupons serão validados pelo servidor em uma próxima atualização.
      </p>
    </div>
  );
}
