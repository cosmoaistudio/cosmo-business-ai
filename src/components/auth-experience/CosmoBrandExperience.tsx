import { type ReactNode } from "react";
import { motion } from "framer-motion";

import { CosmoVoid } from "./BrandUniverse";
import { CosmoCore } from "./CosmoCore";
import { useBrandIntro } from "./hooks/useBrandIntro";

const EASE = [0.22, 1, 0.36, 1] as const;

interface CosmoBrandExperienceProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function CosmoBrandExperience({
  title,
  subtitle,
  children,
}: CosmoBrandExperienceProps) {
  const { phase, introComplete, coreVisible, glowActive, formVisible } =
    useBrandIntro();

  return (
    <div className="cosmo-portal">
      <CosmoVoid introPhase={phase} />

      <div className="cosmo-portal__beam" aria-hidden />

      <div className="cosmo-portal__content">
        <motion.div
          className="cosmo-portal__singularity"
          initial={{ opacity: 0, scale: 0.55 }}
          animate={
            coreVisible
              ? {
                  opacity: 1,
                  scale: 1,
                }
              : { opacity: 0, scale: 0.55 }
          }
          transition={{ duration: 1.25, ease: EASE }}
        >
          <CosmoCore
            size={137}
            interactive={introComplete}
            introComplete={glowActive}
          />
        </motion.div>

        <motion.div
          className="cosmo-portal__copy"
          initial={{ opacity: 0, y: 16 }}
          animate={glowActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.75, delay: 0.08, ease: EASE }}
        >
          <span className="cosmo-portal__eyebrow">Cosmo Business AI</span>
          <h1 className="cosmo-portal__title">{title}</h1>
          <p className="cosmo-portal__subtitle">{subtitle}</p>
        </motion.div>

        <motion.div
          className="cosmo-portal__form-wrap"
          initial={{ opacity: 0, y: 32 }}
          animate={formVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <div className="cosmo-portal__form-aura" aria-hidden />
          <div className="cosmo-portal__form">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}

export const LoginExperienceShell = CosmoBrandExperience;
