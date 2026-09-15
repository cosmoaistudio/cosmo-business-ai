import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { Bug, Lightbulb, X } from "lucide-react";
import { toast } from "sonner";
import { feedbackService } from "../services/feedback.service";
import type { FeedbackKind } from "../types/feedback";
import "../styles/saas.css";

export function FeedbackButton({ docked = false }: { docked?: boolean }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("suggestion");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      toast.error("Escreva uma mensagem");
      return;
    }
    try {
      setSending(true);
      const result = await feedbackService.submit({
        kind,
        message: message.trim(),
        pagePath: location.pathname,
      });
      toast.success(result.message);
      setMessage("");
      setOpen(false);
    } catch {
      toast.error("Não foi possível enviar o feedback");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div
        className="cosmo-saas__feedback-fab"
        data-docked={docked ? "true" : "false"}
      >
        <button
          type="button"
          className="cosmo-saas__btn"
          title="Enviar sugestão"
          aria-label="Enviar sugestão"
          onClick={() => {
            setKind("suggestion");
            setOpen(true);
          }}
        >
          <Lightbulb size={14} />
          <span className="cosmo-saas__btn-label">Enviar sugestão</span>
        </button>
        <button
          type="button"
          className="cosmo-saas__btn cosmo-saas__btn--ghost"
          title="Reportar problema"
          aria-label="Reportar problema"
          onClick={() => {
            setKind("bug");
            setOpen(true);
          }}
        >
          <Bug size={14} />
          <span className="cosmo-saas__btn-label">Reportar problema</span>
        </button>
      </div>

      {open ? (
        <div
          className="cosmo-saas__dialog-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="cosmo-saas__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Feedback"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="cosmo-saas__title">
                {kind === "bug" ? "Reportar problema" : "Enviar sugestão"}
              </h2>
              <button
                type="button"
                className="cosmo-saas__btn cosmo-saas__btn--ghost"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>
            <p className="cosmo-saas__desc">
              Página atual: {location.pathname}
            </p>
            <form onSubmit={handleSubmit} className="mt-3 space-y-3">
              <label className="block text-sm text-slate-300">
                Mensagem
                <textarea
                  className="cosmo-saas__field min-h-[120px]"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={
                    kind === "bug"
                      ? "O que aconteceu? Passos para reproduzir…"
                      : "O que gostaria de melhorar no Cosmo?"
                  }
                />
              </label>
              <button
                type="submit"
                className="cosmo-saas__btn"
                disabled={sending}
              >
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
