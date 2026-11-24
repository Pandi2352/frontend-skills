type Cell = string | number | boolean | Date | null | undefined;

function escapeCell(value: Cell) {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Spreadsheets run text that starts like a formula.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export const toCsv = (rows: Cell[][]) => rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');

export function downloadText(name: string, text: string, type = 'text/csv;charset=utf-8') {
  // The mark at the start makes Excel read UTF-8.
  const url = URL.createObjectURL(new Blob(['﻿', text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
