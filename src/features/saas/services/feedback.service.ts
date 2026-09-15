import type { FeedbackPayload, FeedbackResult } from "../types/feedback";

const STORAGE_KEY = "cosmo:saas:feedback";

/**
 * Feedback local — fila pronta para webhook / tickets depois.
 */
export const feedbackService = {
  async submit(payload: FeedbackPayload): Promise<FeedbackResult> {
    const id = crypto.randomUUID();
    const entry = {
      id,
      ...payload,
      createdAt: new Date().toISOString(),
    };

    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const list = raw ? (JSON.parse(raw) as unknown[]) : [];
        list.unshift(entry);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
      } catch {
        // ignore storage failures
      }
    }

    return {
      accepted: true,
      id,
      message:
        payload.kind === "bug"
          ? "Problema registrado. Obrigado pelo reporte."
          : "Sugestão recebida. Obrigado pelo feedback.",
    };
  },
};
