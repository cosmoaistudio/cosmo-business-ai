import {
  DollarSign,
  ShoppingCart,
  Users,
  Bot,
} from "lucide-react";

import StatsCard from "../../components/dashboard/StatsCard";

export default function Dashboard() {
  return (
    <main className="flex-1 bg-slate-100 p-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">
          Centro de Controle
        </h2>

        <p className="mt-2 text-slate-500">
          👋 Bem-vindo à Cosmo Business AI.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Faturamento"
          value="R$ 12.580"
          subtitle="+12%"
          icon={<DollarSign size={24} />}
        />

        <StatsCard
          title="Pedidos"
          value="128"
          subtitle="+8"
          icon={<ShoppingCart size={24} />}
        />

        <StatsCard
          title="Clientes"
          value="392"
          subtitle="+18"
          icon={<Users size={24} />}
        />

        <StatsCard
          title="Cosmo AI"
          value="3"
          subtitle="Sugestões"
          icon={<Bot size={24} />}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800">
          👋 Boa noite, Felipe!
        </h3>

        <p className="mt-3 text-slate-500">
          Bem-vindo ao Centro de Controle da Cosmo Business AI.
        </p>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h4 className="font-semibold text-blue-700">
            💡 Sugestão da Cosmo AI
          </h4>

          <p className="mt-2 text-slate-600">
            Cadastre seus primeiros produtos para publicar seu cardápio online
            e começar a receber pedidos.
          </p>
        </div>
      </div>
    </main>
  );
}