import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Shield } from "lucide-react";

import { usePrefersReducedMotion } from "@/components/auth-experience/hooks/usePrefersReducedMotion";

interface LoginGlassPanelProps {
  children: ReactNode;
}

export function LoginGlassPanel({ children }: LoginGlassPanelProps) {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      className="login-glass"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="login-glass__ambient" aria-hidden />
      <motion.div
        className="login-glass__glow"
        aria-hidden
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.35, 0.75, 0.35], x: ["-10%", "10%", "-10%"] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="login-glass__inner">{children}</div>
      <div className="login-glass__trust">
        <span className="login-glass__trust-item">
          <Shield size={14} />
          Seguro
        </span>
        <span className="login-glass__trust-divider" />
        <span className="login-glass__trust-item">
          <Lock size={14} />
          Privado
        </span>
        <span className="login-glass__trust-divider" />
        <span className="login-glass__trust-item">
          <CheckCircle2 size={14} />
          Confiável
        </span>
      </div>
    </motion.div>
  );
}
