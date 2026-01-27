import type { Investment } from './api';

const GOLD_TYPE_LABELS: Record<string, string> = {
  bar: 'Gold Bar',
  coin: 'Gold Coin',
  jewelry: 'Jewelry',
  other: 'Other',
};

export function exportInvestmentsToCSV(investments: Investment[]): void {
  const headers = [
    'Date',
    'Type',
    'Weight (g)',
    'Price/Gram ($)',
    'Total Cost ($)',
    'Notes',
  ];

  const rows = investments.map((inv) => [
    inv.purchaseDate,
    GOLD_TYPE_LABELS[inv.goldType] || inv.goldType,
    inv.weightGrams.toFixed(2),
    inv.purchasePricePerGram.toFixed(2),
    inv.totalCost.toFixed(2),
    inv.notes ? `"${inv.notes.replace(/"/g, '""')}"` : '',
  ]);

  // Calculate totals
  const totalWeight = investments.reduce((sum, inv) => sum + inv.weightGrams, 0);
  const totalCost = investments.reduce((sum, inv) => sum + inv.totalCost, 0);

  const summaryRow = [
    'TOTAL',
    `${investments.length} investments`,
    totalWeight.toFixed(2),
    '',
    totalCost.toFixed(2),
    '',
  ];

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
    '', // Empty line before summary
    summaryRow.join(','),
  ].join('\n');

  downloadCSV(csvContent, `gold-investments-${formatDate(new Date())}.csv`);
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
