import { Bot, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CosmoAIWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.8 }}
      className="fixed bottom-8 right-8 z-50 w-[360px]"
    >
      <div className="overflow-hidden rounded-3xl border border-blue-500/20 bg-slate-950 shadow-2xl">

        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-5">

          <div className="flex items-center gap-3">

            <motion.div
              animate={{
                rotate: [0, -10, 10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
              }}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600"
            >
              <Bot />
            </motion.div>

            <div>

              <h3 className="font-bold text-white">
                Cosmo AI
              </h3>

              <p className="text-sm text-blue-100">
                Seu consultor inteligente
              </p>

            </div>

          </div>

        </div>

        <div className="space-y-5 p-6">

          <div className="rounded-2xl bg-slate-900 p-4">

            <div className="flex items-center gap-2 font-semibold text-green-400">

              <Sparkles size={18} />

              Oportunidade encontrada

            </div>

            <p className="mt-3 text-sm text-slate-300">

              Seu Açaí 700ml vendeu 38% mais.
              Recomendo destacá-lo na página inicial.

            </p>

          </div>

          <button className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-500">

            Ver análise completa

            <ArrowRight size={18} />

          </button>

        </div>

      </div>
    </motion.div>
  );
}