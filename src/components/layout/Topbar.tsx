import { LogOut, Monitor, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, Button, Tooltip } from "@/design-system";

import { useCosmoAiDrawer } from "@/components/ai/CosmoAiDrawerContext";
import { useDesktopBridge } from "@/desktop";
import {
  getUserDisplayName,
  getUserInitials,
  ROLE_LABELS,
  useAuth,
} from "@/features/auth";

import GlobalCommandSearch from "./GlobalCommandSearch";
import NotificationsMenu from "./NotificationsMenu";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { isDesktop, status } = useDesktopBridge();
  const { toggleDrawer } = useCosmoAiDrawer();

  async function handleSignOut() {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao sair da conta"
      );
      // Estado local já foi limpo no AuthProvider — garante saída da UI privada.
      navigate("/login", { replace: true });
    }
  }

  const desktopOnline = status?.online ?? false;
  const systemLabel = isDesktop
    ? desktopOnline
      ? "Desktop conectado — impressão e gaveta disponíveis"
      : "Desktop offline — use o app Desktop para impressão"
    : "Modo web — impressão térmica exige o app Desktop";

  return (
    <header className="cosmo-glass-topbar flex h-[4.25rem] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-5 lg:px-6">
      <GlobalCommandSearch />

      <div className="flex items-center gap-1 sm:gap-2">
        <Tooltip content={systemLabel}>
          <div className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-2.5 py-1.5 sm:flex">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                !isDesktop || desktopOnline ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <Monitor size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-400">
              {isDesktop ? (desktopOnline ? "Online" : "Offline") : "Web"}
            </span>
          </div>
        </Tooltip>

        <Tooltip content="Cosmo AI">
          <Button
            variant="intelligence"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={toggleDrawer}
          >
            <Sparkles size={15} />
            Cosmo AI
          </Button>
        </Tooltip>

        <NotificationsMenu />

        <div className="hidden items-center gap-2.5 pl-1 md:flex">
          <Avatar fallback={getUserInitials(user)} size="sm" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {getUserDisplayName(user)}
            </h3>
            <p className="truncate text-xs text-slate-500">
              {profile?.role
                ? ROLE_LABELS[profile.role]
                : (user?.email ?? "Usuário")}
            </p>
          </div>
        </div>

        <Tooltip content="Sair">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void handleSignOut()}
            aria-label="Sair"
          >
            <LogOut size={17} />
          </Button>
        </Tooltip>
      </div>
    </header>
  );
}
