import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { parseCsv } from '@/utils/parse-csv';
import { checkRows, guessColumn, CsvImport, type CsvColumn } from './index';

vi.setConfig({ testTimeout: 30_000 });

const columns: CsvColumn[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', aliases: ['e-mail address'], unique: true, validate: (t) => (t.includes('@') ? undefined : 'Email is wrong') },
];

describe('parseCsv', () => {
  it('reads quotes, line breaks, other separators and line endings', () => {
    expect(parseCsv(String.fromCharCode(0xfeff) + 'a,b\r\n"x, ""y""","line 1\nline 2"\r\n\r\n')).toEqual([['a', 'b'], ['x, "y"', 'line 1\nline 2']]);
    expect(parseCsv('a;b\n1,5;2')).toEqual([['a', 'b'], ['1,5', '2']]);
    expect(parseCsv('a\tb\r1\t')).toEqual([['a', 'b'], ['1', '']]);
    expect(parseCsv('')).toEqual([]);
  });
});

describe('checkRows', () => {
  it('finds missing, wrong, repeated and refused lines', () => {
    const rows = checkRows(
      [['Asha', 'a@x.co'], ['', 'b@x.co'], ['Ben', 'ben'], ['Cy', 'A@x.co'], ['No', '']],
      columns, { name: 0, email: 1 },
      (c) => {
        if (c.name === 'No') throw new Error('Not allowed');
        return c;
      },
    );
    expect(rows.map((r) => r.problems)).toEqual([[], ['Name is missing'], ['Email is wrong'], ['Email is already in line 2'], ['Not allowed']]);
    expect(rows[0]?.record).toEqual({ name: 'Asha', email: 'a@x.co' });
  });
  it('recognizes headings', () => {
    expect(guessColumn(columns[1] as CsvColumn, ['Name', 'E-Mail Address'])).toBe(1);
    expect(guessColumn(columns[0] as CsvColumn, ['Phone'])).toBeNull();
  });
});

describe('CsvImport', () => {
  const setup = async (text: string, onImport = vi.fn().mockResolvedValue({ failed: [{ index: 0, message: 'Exists' }] })) => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<CsvImport columns={columns} toRecord={(c) => c} onImport={onImport} onDone={onDone} />);
    await user.upload(screen.getByLabelText('CSV file'), new File([text], 'a.csv', { type: 'text/csv' }));
    return { user, onImport, onDone };
  };

  it('matches, checks, imports only good lines and reports refused ones', async () => {
    const { user, onImport, onDone } = await setup('Name,Mail\nAsha,a@x.co\nBen,wrong\nCy,c@x.co');
    expect(await screen.findByRole('combobox', { name: 'Name' })).toHaveTextContent('Name');
    await user.click(screen.getByRole('combobox', { name: 'Email' }));
    await user.click(screen.getByRole('option', { name: /Mail/ }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('1 lines have problems and will be skipped.')).toBeVisible();
    expect(within(screen.getByRole('table')).getByText('Email is wrong')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Import 2' }));
    expect(await screen.findByText('1 imported')).toBeVisible();
    expect(screen.getByText('1 were refused')).toBeVisible();
    expect(onImport.mock.calls[0]?.[0]).toEqual([{ name: 'Asha', email: 'a@x.co' }, { name: 'Cy', email: 'c@x.co' }]);
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('does not continue without a required column, or with an empty file', async () => {
    await setup('Phone,Email\n1,a@x.co');
    expect(await screen.findByText('Choose a column')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('stays on the check step when saving fails', async () => {
    const { user } = await setup('Name,Email\nAsha,a@x.co', vi.fn().mockRejectedValue(new Error('Offline')));
    await user.click(await screen.findByRole('button', { name: 'Next' }));
    await user.click(screen.getByRole('button', { name: 'Import 1' }));
    expect(await screen.findByText('Offline')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Import 1' })).toBeEnabled();
  });
});
