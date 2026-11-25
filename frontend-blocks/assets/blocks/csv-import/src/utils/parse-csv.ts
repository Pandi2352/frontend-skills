/** Counts a separator outside quotes in the first line. */
function guessSeparator(text: string) {
  const line = text.slice(0, text.search(/[\r\n]|$/)).replace(/"[^"]*"/g, '');
  const found = [',', ';', '\t', '|'].map((s) => ({ s, n: line.split(s).length }));
  return found.sort((a, b) => b.n - a.n)[0]?.s ?? ',';
}

/** Reads CSV also with quotes, line breaks inside cells, and semicolons or tabs. Empty lines are skipped. */
export function parseCsv(source: string): string[][] {
  // Excel puts an invisible mark at the start.
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const separator = guessSeparator(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  const endCell = () => {
    row.push(cell.trim());
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((c) => c !== '')) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i] ?? '';
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = false;
    } else if (c === '"' && cell.trim() === '') {
      cell = '';
      quoted = true;
    } else if (c === separator) endCell();
    else if (c === '\n') endRow();
    else if (c !== '\r') cell += c;
    else if (text[i + 1] !== '\n') endRow();
  }
  endRow();
  return rows;
}
