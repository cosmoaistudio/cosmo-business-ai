import { type ReactNode } from "react";
import { motion } from "framer-motion";

import { LoginCosmicScene } from "./LoginCosmicScene";
import { LoginCosmoMark } from "./LoginCosmoMark";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface LoginOfficialShellProps {
  children: ReactNode;
  /** When false, hides brand block (signup/forgot/reset) */
  showBrand?: boolean;
  headline?: string;
  subheadline?: string;
}

export function LoginOfficialShell({
  children,
  showBrand = true,
  headline,
  subheadline,
}: LoginOfficialShellProps) {
  return (
    <div className="login-official">
      <LoginCosmicScene />

      <div className="login-official__scroll">
        <motion.div
          className="login-official__content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          {showBrand ? (
            <header className="login-official__brand">
              <LoginCosmoMark />
              <h1 className="login-official__wordmark">COSMO</h1>
              <p className="login-official__eyebrow">BUSINESS AI</p>
              <p className="login-official__tagline">
                Entre no universo da gestão inteligente
              </p>
              <p className="login-official__tagline-sub">
                Dados, automações e inteligência para fazer seu negócio crescer.
              </p>
            </header>
          ) : (
            <header className="login-official__brand login-official__brand--compact">
              {headline && (
                <h1 className="login-official__wordmark login-official__wordmark--sm">
                  {headline}
                </h1>
              )}
              {subheadline && (
                <p className="login-official__tagline">{subheadline}</p>
              )}
            </header>
          )}

          <div className="login-official__form">{children}</div>

          <p className="login-official__copyright">
            © 2026 Cosmo Business AI. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
