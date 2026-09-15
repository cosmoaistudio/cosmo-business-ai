import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Card from "@/components/shared/Card";
import { formatCurrency } from "@/lib/format";
import { financeService } from "../services/finance.service";
import type { FinanceFilters } from "../repository/finance.repository";
import type { FinanceStats } from "../types/finance";
import {
  exportFinanceReportExcel,
  exportFinanceReportPdf,
} from "../utils/exportFinanceReport";

interface FinanceReportsPanelProps {
  stats: FinanceStats;
  filters: FinanceFilters;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export default function FinanceReportsPanel({
  stats,
  filters,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: FinanceReportsPanelProps) {
  async function handleExport(type: "pdf" | "excel") {
    const report = await financeService.getReport({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      type: filters.type,
    });

    if (type === "pdf") {
      await exportFinanceReportPdf(report);
      return;
    }

    await exportFinanceReportExcel(report);
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900">Relatórios</h2>
        <p className="mt-1 text-sm text-slate-500">
          Filtre o período e exporte o fluxo de caixa em PDF ou Excel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="report-start-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Data inicial
          </label>
          <input
            id="report-start-date"
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="report-end-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Data final
          </label>
          <input
            id="report-end-date"
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Entradas</p>
          <p className="font-bold text-emerald-700">
            {formatCurrency(stats.totalIncome)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Despesas</p>
          <p className="font-bold text-red-700">
            {formatCurrency(stats.totalExpenses)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Lucro</p>
          <p className="font-bold text-blue-700">
            {formatCurrency(stats.profit)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => handleExport("pdf")}
        >
          <FileText size={16} />
          Exportar PDF
        </Button>

        <Button
          className="rounded-xl"
          onClick={() => handleExport("excel")}
        >
          <FileSpreadsheet size={16} />
          Exportar Excel
        </Button>
      </div>
    </Card>
  );
}
