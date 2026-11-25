import { CircleCheck, Download } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/fields/select/Dropdown';
import { FileUpload } from '@/components/ui/fields/upload/FileUpload';
import { Progress } from '@/components/ui/loader';
import { Stepper } from '@/components/ui/stepper';
import { useStepper } from '@/hooks/useStepper';
import { downloadText, toCsv } from '@/utils/csv';
import { parseCsv } from '@/utils/parse-csv';
import { checkRows, guessColumn, type CheckedRow, type CsvColumn } from './check-rows';

export interface CsvImportProps<T> {
  columns: CsvColumn[];
  /** Turns one checked line into your type. Throw an Error to reject the line. */
  toRecord: (cells: Record<string, string>) => T;
  /** Saves the lines that are right. Returns the lines the server refused, if any. */
  onImport: (
    records: T[],
    options: { onProgress: (percent: number) => void; signal: AbortSignal },
  ) => Promise<{ failed?: { index: number; message: string }[] } | void>;
  onDone: () => void;
  /** Offers an empty file with the right headings. */
  templateName?: string;
  maxRows?: number;
  maxSize?: number;
}

export const csvText = {
  steps: ['Choose file', 'Match columns', 'Check', 'Finish'],
  label: 'Import',
  file: 'CSV file',
  fileHint: 'One line per record, with headings in the first line.',
  template: 'Download an empty file',
  empty: 'This file has no lines below the headings.',
  unreadable: 'This file could not be read.',
  tooMany: (max: number) => `This file has more than ${max} lines.`,
  notUsed: 'Not in the file',
  matchTwice: 'Used twice',
  matchNeeded: 'Choose a column',
  back: 'Back',
  next: 'Next',
  again: 'Import another file',
  done: 'Done',
  line: 'Line',
  problem: 'Problem',
  ok: 'OK',
  import: (n: number) => `Import ${n}`,
  skipped: (n: number) => `${n} lines have problems and will be skipped.`,
  report: 'Download the problems',
  progress: 'Importing',
  imported: (n: number) => `${n} imported`,
  refused: (n: number) => `${n} were refused`,
  failed: 'The import did not finish.',
};

type Result<T> = { done: number; refused: { row: CheckedRow<T>; message: string }[] };

/** Choose a file, match its columns, see every problem before saving, then import with progress. */
export function CsvImport<T>(props: CsvImportProps<T>) {
  const { columns, toRecord, onImport, onDone, templateName, maxRows = 5000, maxSize = 5 * 1024 * 1024 } = props;
  const steps = useStepper(4);
  const [files, setFiles] = useState<File[]>([]);
  const [lines, setLines] = useState<string[][]>([]);
  const [match, setMatch] = useState<Record<string, number | null>>({});
  const [problem, setProblem] = useState('');
  const [percent, setPercent] = useState<number | null>(null);
  const [result, setResult] = useState<Result<T> | null>(null);
  const running = useRef<AbortController>(null);
  useEffect(() => () => running.current?.abort(), []);

  const step = steps.current;
  const headings = lines[0] ?? [];
  const used = Object.values(match).filter((v) => v !== null);
  const matchError = (c: CsvColumn) => {
    const at = match[c.key] ?? null;
    if (at === null) return c.required ? csvText.matchNeeded : undefined;
    return used.filter((u) => u === at).length > 1 ? csvText.matchTwice : undefined;
  };
  const checked = useMemo(
    () => (step < 2 ? [] : checkRows(lines.slice(1), columns, match, toRecord)),
    [step, lines, columns, match, toRecord],
  );
  const good = checked.filter((r) => !r.problems.length);
  const bad = checked.filter((r) => r.problems.length);

  const readFile = async (next: File[]) => {
    setFiles(next);
    setProblem('');
    const file = next[0];
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) return setProblem(csvText.empty);
      if (rows.length - 1 > maxRows) return setProblem(csvText.tooMany(maxRows));
      setLines(rows);
      setMatch(Object.fromEntries(columns.map((c) => [c.key, guessColumn(c, rows[0] ?? [])])));
      steps.goTo(1);
    } catch {
      setProblem(csvText.unreadable);
    }
  };

  const start = async () => {
    const controller = new AbortController();
    running.current = controller;
    setProblem('');
    setPercent(0);
    try {
      const answer = await onImport(
        good.map((r) => r.record as T),
        { onProgress: (p) => setPercent(Math.round(p)), signal: controller.signal },
      );
      const refused = (answer?.failed ?? []).flatMap(({ index, message }) => {
        const row = good[index];
        return row ? [{ row, message }] : [];
      });
      setResult({ done: good.length - refused.length, refused });
      steps.goTo(3);
    } catch (e) {
      if (!controller.signal.aborted) setProblem(e instanceof Error && e.message ? e.message : csvText.failed);
    } finally {
      setPercent(null);
    }
  };

  const reset = () => {
    setFiles([]);
    setLines([]);
    setResult(null);
    setProblem('');
    steps.reset();
  };

  const report = (rows: { row: CheckedRow<T>; message: string }[]) =>
    downloadText('import-problems.csv', toCsv([
      [csvText.line, csvText.problem, ...columns.map((c) => c.label)],
      ...rows.map(({ row, message }) => [row.line, message, ...columns.map((c) => row.cells[c.key])]),
    ]));

  const table: Column<CheckedRow<T>>[] = [
    { id: 'line', header: csvText.line, value: (r) => r.line, sortable: true, className: 'w-20' },
    {
      id: 'problem', header: csvText.problem, value: (r) => r.problems.join(', ') || csvText.ok, sortable: true,
      cell: (r) => (r.problems.length ? <span className="text-danger">{r.problems.join(', ')}</span> : <Badge variant="success">{csvText.ok}</Badge>),
    },
    ...columns.map((c): Column<CheckedRow<T>> => ({ id: c.key, header: c.label, value: (r) => r.cells[c.key] })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Stepper label={csvText.label} current={step} reached={steps.reached} steps={csvText.steps.map((label) => ({ id: label, label }))} />
      {problem && <Alert variant="error">{problem}</Alert>}

      {step === 0 && (
        <div className="flex flex-col items-start gap-3">
          <FileUpload label={csvText.file} helperText={csvText.fileHint} accept=".csv,text/csv" maxSize={maxSize} value={files} onChange={(next) => void readFile(next)} className="w-full" />
          {templateName && (
            <Button variant="link" className="px-0" leftIcon={Download} onClick={() => downloadText(`${templateName}.csv`, toCsv([columns.map((c) => c.label)]))}>
              {csvText.template}
            </Button>
          )}
        </div>
      )}

      {step === 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {columns.map((c) => (
              <Dropdown<number>
                key={c.key}
                label={c.label}
                required={!!c.required}
                clearable={!c.required}
                placeholder={csvText.notUsed}
                error={matchError(c)}
                value={match[c.key] ?? null}
                onChange={(at) => setMatch({ ...match, [c.key]: at })}
                options={headings.map((h, i) => ({ value: i, label: h || `${i + 1}`, description: lines[1]?.[i] ?? '' }))}
              />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={reset}>{csvText.back}</Button>
            <Button disabled={columns.some(matchError)} onClick={() => steps.goTo(2)}>{csvText.next}</Button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          {bad.length > 0 && (
            <Alert
              variant="warning"
              action={<Button size="sm" variant="outline" onClick={() => report(bad.map((row) => ({ row, message: row.problems.join(', ') })))}>{csvText.report}</Button>}
            >
              {csvText.skipped(bad.length)}
            </Alert>
          )}
          <DataTable caption={csvText.label} columns={table} data={checked} getRowId={(r) => String(r.line)} getRowName={(r) => `${csvText.line} ${r.line}`} columnPicker={false} />
          {percent !== null && <Progress label={csvText.progress} value={percent} showValue />}
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={percent !== null} onClick={() => steps.goTo(1)}>{csvText.back}</Button>
            <Button isLoading={percent !== null} disabled={!good.length} onClick={() => void start()}>{csvText.import(good.length)}</Button>
          </div>
        </>
      )}

      {step === 3 && result && (
        <div className="flex flex-col items-center gap-4 p-6 text-center">
          <CircleCheck aria-hidden className="size-10 text-success" />
          <p role="status" className="font-medium">{csvText.imported(result.done)}</p>
          {result.refused.length > 0 && (
            <Alert variant="warning" action={<Button size="sm" variant="outline" onClick={() => report(result.refused)}>{csvText.report}</Button>}>
              {csvText.refused(result.refused.length)}
            </Alert>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={reset}>{csvText.again}</Button>
            <Button onClick={onDone}>{csvText.done}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
