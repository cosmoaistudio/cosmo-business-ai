import { ChefHat, QrCode, Store } from "lucide-react";
import { Link } from "react-router-dom";

import PageHeader from "@/components/shared/PageHeader";

const hubs = [
  {
    to: "/cozinha",
    icon: ChefHat,
    title: "Cozinha (KDS)",
    description:
      "Acompanhe e avance pedidos em preparo vindos do PDV e do pedido digital.",
    cta: "Abrir cozinha",
  },
  {
    to: "/pdv",
    icon: Store,
    title: "Nova venda no PDV",
    description:
      "Registre um pedido presencial. Ele aparece na cozinha e no financeiro ao finalizar.",
    cta: "Abrir PDV",
  },
  {
    to: "/configuracoes/pedido-digital",
    icon: QrCode,
    title: "Pedido digital",
    description:
      "Publique a loja, gere QR Codes e receba pedidos de mesa, retirada ou delivery.",
    cta: "Configurar loja",
  },
];

export default function Orders() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        subtitle="Escolha o canal certo. Pedidos ativos são operados na cozinha."
      />

      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-sm text-slate-300">
        <p className="font-medium text-slate-100">Como funciona</p>
        <p className="mt-1 text-slate-400">
          1) Crie a venda no PDV ou no pedido digital → 2) A cozinha prepara → 3)
          O financeiro registra automaticamente.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {hubs.map((hub) => {
          const Icon = hub.icon;
          return (
            <Link
              key={hub.to}
              to={hub.to}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-sky-500/5 hover:shadow-lg hover:shadow-sky-950/30"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                <Icon size={20} />
              </div>
              <h2 className="text-base font-semibold text-white">{hub.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {hub.description}
              </p>
              <span className="mt-4 inline-flex text-sm font-medium text-sky-300 group-hover:text-sky-200">
                {hub.cta} →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
