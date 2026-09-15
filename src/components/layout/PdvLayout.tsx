import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";

interface PdvLayoutProps {
  children: ReactNode;
}

export default function PdvLayout({ children }: PdvLayoutProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao sair da conta"
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="cosmo-logo-shell flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-600/20">
              <div className="cosmo-logo-mark flex h-full w-full items-center justify-center rounded-xl">
                <span className="text-lg font-black text-white">C</span>
              </div>
            </div>

            <div>
              <h1 className="text-lg font-black tracking-wide text-slate-900">
                PDV — Cosmo Business
              </h1>
              <p className="text-sm text-slate-500">Ponto de venda</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="cosmo-button inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Voltar ao painel
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="cosmo-button inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="app-main-surface mx-auto w-full max-w-[1600px] flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
