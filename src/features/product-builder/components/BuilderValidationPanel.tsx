import { AlertCircle, CheckCircle2, Link2 } from "lucide-react";
import type { BuilderValidationState } from "../utils/builderEngineBridge";

interface BuilderValidationPanelProps {
  validation: BuilderValidationState | null;
}

export default function BuilderValidationPanel({
  validation,
}: BuilderValidationPanelProps) {
  if (!validation) return null;

  const previewErrors = validation.previewValidation.errors;
  const ruleErrors = validation.rulesValidation.errors;
  const allErrors = [
    ...validation.productErrors,
    ...Object.values(validation.groupErrors).flat(),
    ...previewErrors,
    ...ruleErrors,
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        {validation.valid ? (
          <CheckCircle2 className="text-emerald-600" size={20} />
        ) : (
          <AlertCircle className="text-amber-600" size={20} />
        )}
        <div>
          <p className="font-semibold text-slate-900">Validação em tempo real</p>
          <p className="text-sm text-slate-500">
            ProductValidator · ProductRulesEngine · DependencyEngine
          </p>
        </div>
      </div>

      {validation.valid ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Composição válida. Preview pronto para simulação.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {allErrors.map((error) => (
            <li
              key={error}
              className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              {error}
            </li>
          ))}
        </ul>
      )}

      {validation.previewValidation.warnings.length > 0 && (
        <ul className="mt-3 space-y-2">
          {validation.previewValidation.warnings.map((warning) => (
            <li
              key={warning}
              className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-800"
            >
              {warning}
            </li>
          ))}
        </ul>
      )}

      {validation.dependencyWarnings.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Link2 size={14} />
            Dependências de estoque
          </p>
          {validation.dependencyWarnings.map((warning) => (
            <p
              key={warning}
              className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {warning}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
