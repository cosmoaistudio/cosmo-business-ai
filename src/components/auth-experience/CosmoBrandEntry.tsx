import { motion } from "framer-motion";
import { useEffect } from "react";

import { CosmoVoid } from "./BrandUniverse";
import { CosmoCore } from "./CosmoCore";

const EASE = [0.45, 0, 0.55, 1] as const;

interface CosmoBrandEntryProps {
  onComplete?: () => void;
}

export function CosmoBrandEntry({ onComplete }: CosmoBrandEntryProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => onComplete?.(), 2800);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="cosmo-brand-entry"
      initial={{ opacity: 1 }}
      aria-hidden
    >
      <CosmoVoid introPhase={6} />

      <motion.div
        className="cosmo-brand-entry__warp"
        initial={{ opacity: 0.2, scale: 1 }}
        animate={{ opacity: 1, scale: 3.4 }}
        transition={{ duration: 1.85, ease: EASE }}
      />

      <motion.div
        className="cosmo-brand-entry__singularity"
        initial={{ scale: 1 }}
        animate={{ scale: 18 }}
        transition={{ duration: 2.1, ease: EASE }}
      >
        <CosmoCore size={90} interactive={false} introComplete />
      </motion.div>

      <motion.div
        className="cosmo-brand-entry__aperture"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 4.5, opacity: 1 }}
        transition={{ duration: 1.35, delay: 0.45, ease: EASE }}
      />

      <motion.div
        className="cosmo-brand-entry__flash"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 1.15, delay: 0.85, ease: EASE }}
      />

      <div className="cosmo-brand-entry__loading">
        <p>Entrando no universo Cosmo...</p>
        <div className="cosmo-brand-splash__track">
          <motion.div
            className="cosmo-brand-splash__bar"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.4, ease: EASE }}
            style={{ transformOrigin: "left" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/** @deprecated */
export const CosmoEntryTransition = CosmoBrandEntry;
