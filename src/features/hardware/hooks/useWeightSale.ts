import { useCallback, useState } from "react";
import { getDesktopApi, isDesktopApp } from "@/desktop/types";

export interface WeightSaleConfig {
  pricePerKg: number;
  pricePerGram?: number;
  minKg: number;
  maxKg: number;
  rounding: "none" | "2dp" | "3dp";
  autoTare: boolean;
}

const DEFAULT_CONFIG: WeightSaleConfig = {
  pricePerKg: 0,
  minKg: 0.01,
  maxKg: 50,
  rounding: "3dp",
  autoTare: false,
};

/**
 * PDV "Venda por Peso" — arquitetura.
 * Lê peso apenas via Desktop Agent. Não altera o motor de venda do PDV;
 * o caller adiciona o item com quantidade = kg.
 */
export function useWeightSale(initial?: Partial<WeightSaleConfig>) {
  const [config, setConfig] = useState<WeightSaleConfig>({
    ...DEFAULT_CONFIG,
    ...initial,
  });
  const [lastWeightKg, setLastWeightKg] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const readWeight = useCallback(async () => {
    setError(null);
    if (!isDesktopApp()) {
      setError("Venda por peso requer Cosmo Business (Electron).");
      return null;
    }

    const api = getDesktopApi();
    if (!api) return null;

    try {
      setLoading(true);
      if (config.autoTare) {
        await api.scaleTare();
      }
      const result = await api.scaleRead();
      if (!result.ok || !result.data) {
        setError(result.error ?? "Não foi possível ler o peso");
        return null;
      }
      const kg = Number((result.data as { kg?: number }).kg);
      if (!Number.isFinite(kg)) {
        setError("Leitura inválida");
        return null;
      }
      if (kg < config.minKg || kg > config.maxKg) {
        setError(`Peso fora da faixa (${config.minKg}–${config.maxKg} kg)`);
        return null;
      }
      setLastWeightKg(kg);
      return kg;
    } finally {
      setLoading(false);
    }
  }, [config.autoTare, config.maxKg, config.minKg]);

  function computeTotal(kg: number) {
    const raw =
      config.pricePerGram != null
        ? config.pricePerGram * kg * 1000
        : config.pricePerKg * kg;
    if (config.rounding === "2dp") return Math.round(raw * 100) / 100;
    if (config.rounding === "3dp") return Math.round(raw * 1000) / 1000;
    return raw;
  }

  return {
    config,
    setConfig,
    lastWeightKg,
    error,
    loading,
    readWeight,
    computeTotal,
    available: isDesktopApp(),
  };
}
