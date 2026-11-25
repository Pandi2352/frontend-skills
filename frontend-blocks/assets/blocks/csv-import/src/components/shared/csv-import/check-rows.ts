export interface CsvColumn {
  key: string;
  label: string;
  required?: boolean;
  /** Other headings that mean the same, e.g. ["e-mail", "mail"]. */
  aliases?: string[];
  /** A message when the text is wrong. Empty cells are not checked here. */
  validate?: (text: string) => string | undefined;
  /** The same value may appear only once in the file. */
  unique?: boolean;
}

export interface CheckedRow<T> {
  /** Line in the file; the headings are line 1. */
  line: number;
  cells: Record<string, string>;
  problems: string[];
  record?: T;
}

export const checkText = {
  required: (label: string) => `${label} is missing`,
  twice: (label: string, line: number) => `${label} is already in line ${line}`,
};

const plain = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

/** Index of the heading that fits, or null. */
export function guessColumn(column: CsvColumn, headings: string[]): number | null {
  const names = [column.label, column.key, ...(column.aliases ?? [])].map(plain);
  const found = headings.findIndex((h) => names.includes(plain(h)));
  return found < 0 ? null : found;
}

export function checkRows<T>(
  lines: string[][],
  columns: CsvColumn[],
  match: Record<string, number | null>,
  toRecord: (cells: Record<string, string>) => T,
): CheckedRow<T>[] {
  const seen = new Map<string, number>();
  return lines.map((cellsInLine, i) => {
    const line = i + 2;
    const problems: string[] = [];
    const cells: Record<string, string> = {};
    for (const c of columns) {
      const at = match[c.key] ?? null;
      const text = at === null ? '' : (cellsInLine[at] ?? '');
      cells[c.key] = text;
      if (!text) {
        if (c.required) problems.push(checkText.required(c.label));
        continue;
      }
      const wrong = c.validate?.(text);
      if (wrong) problems.push(wrong);
      if (c.unique) {
        const key = `${c.key} ${text.toLowerCase()}`;
        const first = seen.get(key);
        if (first) problems.push(checkText.twice(c.label, first));
        else seen.set(key, line);
      }
    }
    if (problems.length) return { line, cells, problems };
    try {
      return { line, cells, problems, record: toRecord(cells) };
    } catch (e) {
      return { line, cells, problems: [e instanceof Error ? e.message : String(e)] };
    }
  });
}
