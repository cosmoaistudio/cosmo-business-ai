import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/features/auth";
import { canAccessRoute, type AppRoute } from "@/features/auth/types/roles";

type FullscreenOpsChromeProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Extra actions on the right (settings, refresh, etc.). */
  actions?: ReactNode;
  backTo?: string;
  backLabel?: string;
};

/**
 * Lightweight chrome for fullscreen operational screens (Kitchen, etc.)
 * that intentionally sit outside AppLayout — includes real logout.
 */
export default function FullscreenOpsChrome({
  title,
  subtitle,
  children,
  actions,
  backTo = "/",
  backLabel = "Voltar ao Cosmo",
}: FullscreenOpsChromeProps) {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const role = profile?.role;
  const canGoBack =
    Boolean(role) && canAccessRoute(role, backTo as AppRoute);

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao sair da conta"
      );
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-600/20">
              <span className="text-lg font-black text-white">C</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cosmo Business
              </p>
              <h1 className="truncate text-lg font-black text-slate-900">
                {title}
              </h1>
              {subtitle ? (
                <p className="truncate text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {actions}
            {canGoBack ? (
              <Link
                to={backTo}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={16} />
                {backLabel}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              aria-label="Sair"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
