import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button, Tooltip } from "@/design-system";
import { useCosmoAiContext } from "@/features/cosmo-ai";

export default function NotificationsMenu() {
  const navigate = useNavigate();
  const { data } = useCosmoAiContext();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const alerts = data?.alerts?.slice(0, 5) ?? [];
  const priorities = data?.priorities?.slice(0, 3) ?? [];
  const items = [...alerts, ...priorities].slice(0, 6);
  const count = items.length;

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <Tooltip content="Notificações">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificações"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="relative">
            <Bell size={17} />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-sky-400 px-1 text-[0.55rem] font-bold text-slate-950 ring-2 ring-[#020617]">
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </span>
        </Button>
      </Tooltip>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.45rem)] z-50 w-[20rem] overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]/98 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-white/8 px-3.5 py-2.5">
            <p className="text-sm font-semibold text-white">Notificações</p>
            <p className="text-xs text-slate-500">
              Alertas e prioridades da operação
            </p>
          </div>

          {count === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-200">
                Nenhuma notificação agora
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Quando houver alertas de estoque, vendas ou cozinha, eles
                aparecem aqui.
              </p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full px-3.5 py-2.5 text-left transition hover:bg-white/[0.04]"
                    onClick={() => {
                      setOpen(false);
                      navigate(item.href || "/ia");
                    }}
                  >
                    <p className="text-sm font-medium text-slate-100">
                      {item.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                      {item.message}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-white/8 p-2">
            <button
              type="button"
              className="w-full rounded-lg px-3 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-500/10"
              onClick={() => {
                setOpen(false);
                navigate("/ia");
              }}
            >
              Abrir Cosmo AI
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
