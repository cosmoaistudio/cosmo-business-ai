import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useMotionPreferences } from "@/motion/hooks/useMotionPreferences";
import { fadeSlideUp, reducedMotionVariants } from "@/motion/transitions";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  const { reducedMotion } = useMotionPreferences();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={reducedMotion ? reducedMotionVariants : fadeSlideUp}
      className="mb-8 flex flex-wrap items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action}
    </motion.div>
  );
}
