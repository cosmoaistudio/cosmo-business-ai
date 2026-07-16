import {
  DollarSign,
  ShoppingCart,
  Users,
  Bot,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

import { motion } from "framer-motion";

import StatsCard from "../../components/dashboard/StatsCard";

export default function Dashboard() {
  return (
    <main className="space-y-8">

      <motion.div
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: .5 }}
      >

        <h1 className="text-4xl font-black text-slate-900">
          👋 Boa noite!
        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Bem-vindo de volta à Cosmo Business AI.
        </p>

      </motion.div>

      <section className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">

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
          value="5"
          subtitle="Insights"
          icon={<Bot size={24} />}
        />

      </section>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: .25 }}
        className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 p-8 text-white shadow-2xl"
      >

        <div className="flex items-center gap-3">

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">

            <Bot size={28} />

          </div>

          <div>

            <h2 className="text-2xl font-bold">
              Cosmo AI
            </h2>

            <p className="text-blue-200">
              Análise inteligente do seu negócio
            </p>

          </div>

        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">

            <div className="flex items-center gap-3">

              <TrendingUp className="text-green-400" />

              <h3 className="font-semibold">
                Oportunidade
              </h3>

            </div>

            <p className="mt-3 text-blue-100">

              O Açaí 700ml vendeu 38% mais nos últimos dias.

              Considere destacá-lo nas promoções desta semana.

            </p>

          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">

            <div className="flex items-center gap-3">

              <AlertTriangle className="text-yellow-300" />

              <h3 className="font-semibold">
                Atenção
              </h3>

            </div>

            <p className="mt-3 text-blue-100">

              O leite em pó pode acabar em aproximadamente
              3 dias.

            </p>

          </div>

        </div>

        <button className="mt-8 flex items-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 font-semibold transition hover:bg-blue-500">

          Ver análise completa

          <ArrowRight size={18} />

        </button>

      </motion.div>

    </main>
  );
}