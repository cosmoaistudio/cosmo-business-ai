import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { DURATION, EASING } from "../animations/presets";
import { CosmoLogo } from "./Logo";

interface CosmoSplashProps {
  children: ReactNode;
  durationMs?: number;
  subtitle?: string;
}

export function CosmoSplash({
  children,
  durationMs = 2200,
  subtitle = "O futuro da gestão começa aqui.",
}: CosmoSplashProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs]);

  return (
    <>
      <AnimatePresence>
        {loading ? (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050816]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: DURATION.slower, ease: EASING.smooth } }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotateY: -180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: DURATION.slower, ease: EASING.smooth }}
            >
              <CosmoLogo size="lg" showText={false} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: DURATION.normal }}
              className="mt-10 text-5xl font-black tracking-[0.28em] text-white"
            >
              COSMO
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="mt-3 text-lg text-blue-300"
            >
              Business AI
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="mt-8 text-sm text-slate-500"
            >
              {subtitle}
            </motion.p>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {children}
    </>
  );
}
