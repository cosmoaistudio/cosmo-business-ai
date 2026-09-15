import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { getDesktopApi, isDesktopApp } from "@/desktop/types";
import { logger } from "@/lib/logger";
import { authService } from "../services/auth.service";
import {
  createOAuthCallbackDedupe,
  extractOAuthCodeFromCallbackUrl,
  isValidCosmoOAuthCallbackUrl,
} from "../oauth/oauthRedirect";
import { shouldAcceptDesktopOAuthCallbacks } from "../oauth/oauthAcceptGate";

/**
 * Electron-only: receives cosmobusiness://auth/callback from Main via preload IPC,
 * exchanges PKCE code in the renderer (publishable key), then AuthProvider reacts.
 */
export default function DesktopOAuthListener() {
  const dedupeRef = useRef(createOAuthCallbackDedupe());
  const busyRef = useRef(false);

  useEffect(() => {
    if (!isDesktopApp()) return;

    const api = getDesktopApi();
    if (!api?.onAuthCallback) return;

    async function handleCallbackUrl(url: string) {
      if (!shouldAcceptDesktopOAuthCallbacks()) {
        logger.info(
          "Deep link OAuth ignorado após logout (aceite reiniciado no próximo Google login)"
        );
        return;
      }

      if (!isValidCosmoOAuthCallbackUrl(url)) {
        toast.error("Retorno de login Google inválido.");
        return;
      }

      const code = extractOAuthCodeFromCallbackUrl(url);
      if (!code) {
        toast.error(
          "Login Google incompleto: código de autorização ausente no retorno."
        );
        return;
      }

      if (!dedupeRef.current.shouldProcess(code)) {
        return;
      }

      if (busyRef.current) return;
      busyRef.current = true;

      try {
        await authService.exchangeOAuthCode(code);
        toast.success(
          "Login com Google concluído. Pode fechar a aba do navegador."
        );
      } catch (error) {
        logger.error("Falha no exchange OAuth Google (Desktop)", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Não foi possível concluir o login com Google."
        );
      } finally {
        busyRef.current = false;
      }
    }

    const unsubscribe = api.onAuthCallback((payload) => {
      if (payload?.url) {
        void handleCallbackUrl(payload.url);
      }
    });

    void api.getPendingAuthCallback?.().then((pending) => {
      if (pending?.url) {
        void handleCallbackUrl(pending.url);
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
