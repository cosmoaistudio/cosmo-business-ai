import type { DigitalQrCodeEntry } from "../types/digitalStore.types";
import { buildQrCodeImageUrl } from "../utils/qrCodeUrls";
import DigitalQrCodeCard from "./DigitalQrCodeCard";

interface DigitalQrCodePanelProps {
  qrCodes: DigitalQrCodeEntry[];
}

export default function DigitalQrCodePanel({ qrCodes }: DigitalQrCodePanelProps) {
  if (qrCodes.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {qrCodes.map((entry) => (
        <DigitalQrCodeCard
          key={`${entry.type}-${entry.tableId ?? entry.label}`}
          entry={entry}
          imageUrl={buildQrCodeImageUrl(entry.url)}
        />
      ))}
    </div>
  );
}
