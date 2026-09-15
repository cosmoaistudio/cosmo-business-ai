import { Link } from "react-router-dom";
import { Monitor, Printer, CheckCircle2, Circle } from "lucide-react";
import { useDesktopBridge } from "@/desktop/useDesktopBridge";
import type { OnboardingState } from "../../types/onboarding";

interface StepProps {
  state: OnboardingState;
  onChange: (patch: Partial<OnboardingState>) => void;
}

export function Step6Printer({ state, onChange }: StepProps) {
  const { isDesktop, status } = useDesktopBridge();
  const desktopReady = isDesktop || status?.online === true;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <Monitor className="mt-1 text-blue-600" size={22} />
          <div>
            <h3 className="font-bold text-slate-900">Desktop Agent</h3>
            <p className="mt-1 text-sm text-slate-600">
              O agente desktop conecta impressoras, sincroniza vendas e recebe
              comandos remotos.
            </p>
            <p className="mt-2 text-sm font-semibold">
              Status:{" "}
              <span className={desktopReady ? "text-emerald-600" : "text-amber-600"}>
                {desktopReady ? "Conectado" : "Aguardando conexão"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 p-5">
        <div className="flex items-start gap-3">
          <Printer className="mt-1 text-violet-600" size={22} />
          <div className="flex-1">
            <h3 className="font-bold text-slate-900">Impressora térmica</h3>
            <p className="mt-1 text-sm text-slate-600">
              Configure a impressora no app desktop. Comandas e recibos serão
              enviados automaticamente pelo PDV.
            </p>
            <label className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.printer.printerConfigured}
                onChange={(e) =>
                  onChange({
                    printer: {
                      ...state.printer,
                      printerConfigured: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm font-medium text-slate-700">
                Impressora configurada
              </span>
            </label>
            <label className="mt-3 block">
              <span className="text-xs font-semibold text-slate-600">Observações</span>
              <input
                className="cosmo-input mt-1 w-full"
                value={state.printer.notes}
                onChange={(e) =>
                  onChange({
                    printer: { ...state.printer, notes: e.target.value },
                  })
                }
                placeholder="Modelo da impressora, porta USB, etc."
              />
            </label>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={state.printer.desktopAgentReady || desktopReady}
          onChange={(e) =>
            onChange({
              printer: {
                ...state.printer,
                desktopAgentReady: e.target.checked || desktopReady,
              },
            })
          }
        />
        <span className="text-sm font-medium text-slate-700">
          Desktop Agent instalado e pronto
        </span>
        {(state.printer.desktopAgentReady || desktopReady) && (
          <CheckCircle2 className="ml-auto text-emerald-500" size={18} />
        )}
      </label>
    </div>
  );
}

export function Step7Kitchen({ state, onChange }: StepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Configure o Kitchen Display para a equipe da cozinha acompanhar pedidos
        em tempo real.
      </p>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">
          Tempo máximo de preparo (minutos)
        </span>
        <input
          type="number"
          min={5}
          max={120}
          className="cosmo-input mt-2 w-32"
          value={state.kitchen.maxPrepMinutes}
          onChange={(e) =>
            onChange({
              kitchen: {
                ...state.kitchen,
                maxPrepMinutes: Number(e.target.value) || 20,
              },
            })
          }
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={state.kitchen.soundEnabled}
          onChange={(e) =>
            onChange({
              kitchen: { ...state.kitchen, soundEnabled: e.target.checked },
            })
          }
        />
        <span className="text-sm font-medium text-slate-700">
          Som ao receber novo pedido
        </span>
      </label>

      <Link
        to="/cozinha"
        target="_blank"
        className="inline-flex rounded-2xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Abrir Kitchen Display
      </Link>
    </div>
  );
}

export function Step9Mobile({ state, onChange }: StepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Baixe o app Cosmo Mobile para gerenciar a operação remotamente, enviar
        comandos ao desktop e receber alertas.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-500">Código de pareamento</p>
        <p className="mt-2 text-4xl font-black tracking-widest text-slate-900">
          {state.mobile.pairingCode}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Informe este código no app mobile em Configurações → Conectar
        </p>
      </div>

      <label className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4">
        <input
          type="checkbox"
          checked={state.mobile.mobileConnected}
          onChange={(e) =>
            onChange({
              mobile: { ...state.mobile, mobileConnected: e.target.checked },
            })
          }
        />
        <span className="text-sm font-medium text-slate-700">
          App mobile conectado
        </span>
        {state.mobile.mobileConnected ? (
          <CheckCircle2 className="ml-auto text-emerald-500" size={18} />
        ) : (
          <Circle className="ml-auto text-slate-300" size={18} />
        )}
      </label>
    </div>
  );
}
