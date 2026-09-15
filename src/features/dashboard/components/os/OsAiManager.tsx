import { Check, Eye, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import type {
  CosmoInsight,
  CosmoRecommendation,
} from "@/features/cosmo-ai/types/cosmoAi";

interface OsAiManagerProps {
  greeting: string;
  priorities: CosmoInsight[];
  insights: CosmoInsight[];
  recommendations: CosmoRecommendation[];
  loading?: boolean;
  onResolve?: (id: string) => void;
  onIgnore?: (id: string) => void;
}

type Finding = {
  id: string;
  title: string;
  message: string;
  href?: string;
};

function collectFindings(
  priorities: CosmoInsight[],
  insights: CosmoInsight[],
  recommendations: CosmoRecommendation[]
): Finding[] {
  const fromInsights = (priorities.length ? priorities : insights).slice(0, 4).map(
    (item) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      href: item.href,
    })
  );

  if (fromInsights.length >= 4) return fromInsights;

  const used = new Set(fromInsights.map((f) => f.id));
  const fromRecs = recommendations
    .filter((r) => !used.has(r.insightId) && !used.has(r.id))
    .slice(0, 4 - fromInsights.length)
    .map((item) => ({
      id: item.insightId || item.id,
      title: item.title,
      message: item.description,
      href: item.href,
    }));

  return [...fromInsights, ...fromRecs];
}

export function OsAiManager({
  greeting,
  priorities,
  insights,
  recommendations,
  loading = false,
  onResolve,
  onIgnore,
}: OsAiManagerProps) {
  const navigate = useNavigate();
  const findings = collectFindings(priorities, insights, recommendations);

  return (
    <motion.section
      className="cosmo-os-panel cosmo-os-ai cosmo-cc-ai"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="cosmo-cc-ai__head">
        <div>
          <span className="cosmo-os-ai__badge">
            <Sparkles size={12} />
            Cosmo AI
          </span>
          <h2 className="cosmo-os-panel__title mt-2">Gerente operacional</h2>
          <p className="cosmo-cc-ai__brief">
            {greeting}.
            <br />
            Analisei sua empresa.
          </p>
        </div>
      </div>

      <p className="cosmo-cc-ai__found-label">Hoje encontrei:</p>

      <div className="cosmo-cc-ai__findings">
        {loading ? (
          <div className="cosmo-os-empty">Analisando operação...</div>
        ) : findings.length === 0 ? (
          <div className="cosmo-os-empty">
            Operação estável. Continuo monitorando vendas, estoque e cozinha.
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {findings.map((item, index) => (
              <motion.article
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: index * 0.04 }}
                className="cosmo-cc-ai__finding"
              >
                <span className="cosmo-cc-ai__check" aria-hidden>
                  ✓
                </span>
                <div className="cosmo-cc-ai__finding-body">
                  <p className="cosmo-cc-ai__finding-title">{item.title}</p>
                  <p className="cosmo-cc-ai__finding-msg">{item.message}</p>
                  <div className="cosmo-cc-ai__finding-actions">
                    <button
                      type="button"
                      onClick={() =>
                        onResolve
                          ? onResolve(item.id)
                          : navigate(item.href || "/ia")
                      }
                    >
                      <Check size={13} />
                      Resolver
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(item.href || "/ia")}
                    >
                      <Eye size={13} />
                      Ver detalhes
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onIgnore ? onIgnore(item.id) : undefined
                      }
                    >
                      Ignorar
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.section>
  );
}
