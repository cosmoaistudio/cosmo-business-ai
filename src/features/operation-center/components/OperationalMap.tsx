import type { OperationalSector } from "../types/operationCenter";
import { SECTOR_STATUS_COLORS, SECTOR_STATUS_DOT } from "../types/operationCenter";

interface OperationalMapProps {
  sectors: OperationalSector[];
  tvMode?: boolean;
}

export default function OperationalMap({ sectors, tvMode = false }: OperationalMapProps) {
  return (
    <div
      className={`grid gap-4 ${
        tvMode ? "grid-cols-2 xl:grid-cols-3" : "grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {sectors.map((sector) => (
        <div
          key={sector.id}
          className={`rounded-3xl border p-5 transition ${SECTOR_STATUS_COLORS[sector.status]} ${
            tvMode ? "p-8" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className={`font-bold ${tvMode ? "text-2xl" : "text-lg"}`}>
              {sector.label}
            </h3>
            <span
              className={`h-3 w-3 rounded-full ${SECTOR_STATUS_DOT[sector.status]}`}
            />
          </div>
          <p className={`mt-3 font-black ${tvMode ? "text-3xl" : "text-xl"}`}>
            {sector.metric}
          </p>
          <p className="mt-1 text-sm opacity-80">{sector.detail}</p>
        </div>
      ))}
    </div>
  );
}
