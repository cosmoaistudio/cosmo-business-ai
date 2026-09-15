import { formatCurrency } from "@/lib/format";
import type { FinanceReportData } from "../types/finance";
import {
  getCategoryLabel,
  TRANSACTION_SOURCE_LABELS,
  TRANSACTION_TYPE_LABELS,
} from "../types/finance";

function formatDate(dateString: string) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("pt-BR");
}

/** Heavy libs (jspdf / xlsx) load only when the user exports. */
export async function exportFinanceReportPdf(report: FinanceReportData) {
  const [{ default: jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;
  const doc = new jsPDF();
  const { stats, transactions, periodLabel } = report;

  doc.setFontSize(18);
  doc.text("Relatório Financeiro — Cosmo Business", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Período: ${periodLabel}`, 14, 28);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 34);

  doc.setTextColor(0);
  autoTable(doc, {
    startY: 42,
    head: [["Indicador", "Valor"]],
    body: [
      ["Entradas", formatCurrency(stats.totalIncome)],
      ["Saídas / Despesas", formatCurrency(stats.totalExpenses)],
      ["Lucro", formatCurrency(stats.profit)],
      ["Saldo", formatCurrency(stats.balance)],
      ["Transações", String(stats.transactionCount)],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  const tableStartY =
    (doc as InstanceType<typeof jsPDF> & { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY ?? 90;

  autoTable(doc, {
    startY: tableStartY + 10,
    head: [["Data", "Tipo", "Categoria", "Descrição", "Origem", "Valor"]],
    body: transactions.map((transaction) => [
      formatDate(transaction.transaction_date),
      TRANSACTION_TYPE_LABELS[transaction.type],
      getCategoryLabel(transaction.category),
      transaction.description,
      TRANSACTION_SOURCE_LABELS[transaction.source],
      formatCurrency(Number(transaction.amount)),
    ]),
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 8 },
  });

  doc.save(`relatorio-financeiro-${Date.now()}.pdf`);
}

export async function exportFinanceReportExcel(report: FinanceReportData) {
  const XLSX = await import("xlsx");
  const { stats, transactions, periodLabel, cashFlow } = report;

  const summarySheet = XLSX.utils.aoa_to_sheet([
    ["Relatório Financeiro — Cosmo Business"],
    ["Período", periodLabel],
    ["Gerado em", new Date().toLocaleString("pt-BR")],
    [],
    ["Indicador", "Valor"],
    ["Entradas", stats.totalIncome],
    ["Saídas / Despesas", stats.totalExpenses],
    ["Lucro", stats.profit],
    ["Saldo", stats.balance],
    ["Transações", stats.transactionCount],
  ]);

  const transactionsSheet = XLSX.utils.json_to_sheet(
    transactions.map((transaction) => ({
      Data: formatDate(transaction.transaction_date),
      Tipo: TRANSACTION_TYPE_LABELS[transaction.type],
      Categoria: getCategoryLabel(transaction.category),
      Descrição: transaction.description,
      Origem: TRANSACTION_SOURCE_LABELS[transaction.source],
      Valor: Number(transaction.amount),
      Observação: transaction.notes ?? "",
    }))
  );

  const cashFlowSheet = XLSX.utils.json_to_sheet(
    cashFlow.map((point) => ({
      Data: formatDate(point.date),
      Dia: point.label,
      Entradas: point.income,
      Saídas: point.expenses,
      Saldo: point.balance,
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Lançamentos");
  XLSX.utils.book_append_sheet(workbook, cashFlowSheet, "Fluxo de Caixa");

  XLSX.writeFile(workbook, `relatorio-financeiro-${Date.now()}.xlsx`);
}
