import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { Form, FormActions, FormField, FormSubmitError } from '@/components/form';
import * as F from './index';

const options: F.Option[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', disabled: true },
  { value: 'c', label: 'Gamma' },
];

/** Holds a value the way a form does. */
function Held<T>(props: { start: T; onValue: (v: T) => void; children: (v: T, set: (v: T) => void) => ReactElement }) {
  const [value, setValue] = useState(props.start);
  return props.children(value, (v) => {
    setValue(v);
    props.onValue(v);
  });
}

// Long lists are slow in jsdom.
vi.setConfig({ testTimeout: 30_000 });

describe('text', () => {
  it('Input clears, counts and fires change', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.Input label="Name" clearable showCount maxLength={10} onChange={onChange} />);
    await user.type(screen.getByLabelText('Name'), 'Asha');
    expect(screen.getByText('4 / 10')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(onChange).toHaveBeenCalledTimes(5);
  });

  it('PasswordInput shows and hides', async () => {
    const user = userEvent.setup();
    render(<F.PasswordInput label="Password" showStrength />);
    const box = screen.getByLabelText('Password');
    await user.type(box, 'Abcdef1!');
    expect(screen.getByText('Strong')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(box).toHaveAttribute('type', 'text');
  });

  it('SearchInput waits, then searches once', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<F.SearchInput label="Find" onSearch={onSearch} debounceMs={50} />);
    await user.type(screen.getByLabelText('Find'), 'abc');
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith('abc'));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('MaskedInput formats and returns raw text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.MaskedInput label="Card" mask={F.masks.creditCard} onChange={onChange} />);
    await user.type(screen.getByLabelText('Card'), '42424242x4');
    expect(screen.getByLabelText('Card')).toHaveValue('4242 4242 4');
    expect(onChange).toHaveBeenLastCalledWith('424242424');
  });

  it('OtpInput accepts paste and completes', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<F.OtpInput label="Code" onComplete={onComplete} />);
    await user.click(screen.getByLabelText('Code'));
    await user.paste('12 34-56');
    expect(onComplete).toHaveBeenCalledWith('123456');
  });

  it('TagsInput adds, rejects duplicates and removes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.TagsInput label="Tags" onChange={onChange} />);
    await user.type(screen.getByLabelText('Tags'), 'one{Enter}two,ONE{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['one', 'two']);
    expect(screen.getByText('"ONE" is already added')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Remove one' }));
    expect(onChange).toHaveBeenLastCalledWith(['two']);
  });

  it('InlineEdit saves, and shows a failed save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValueOnce(new Error('Server said no')).mockResolvedValue(undefined);
    render(<F.InlineEdit label="Title" value="Old" onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Edit Title' }));
    expect(screen.getByLabelText('Title')).toHaveFocus();
    await user.type(screen.getByLabelText('Title'), '!{Enter}');
    expect(await screen.findByText('Server said no')).toBeVisible();
    await user.type(screen.getByLabelText('Title'), '{Enter}');
    expect(await screen.findByRole('button', { name: 'Edit Title' })).toBeVisible();
  });
});

describe('numbers', () => {
  it('is null when empty, limits on blur, and steps', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Held<number | null> start={null} onValue={onValue}>
        {(v, set) => <F.NumberInput label="Qty" min={1} max={10} value={v} onChange={set} />}
      </Held>,
    );
    const box = screen.getByLabelText('Qty');
    await user.type(box, '50');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith(10);
    await user.click(box);
    await user.keyboard('{ArrowDown}');
    expect(onValue).toHaveBeenLastCalledWith(9);
    await user.clear(box);
    expect(onValue).toHaveBeenLastCalledWith(null);
  });

  it('CurrencyInput groups and keeps decimals', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.CurrencyInput label="Price" currency="USD" onChange={onChange} />);
    await user.type(screen.getByLabelText('Price'), '1234.5');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith(1234.5);
    expect(screen.getByLabelText('Price')).toHaveValue('1,234.5');
  });

  it('RangeSlider keeps the low end below the high end', () => {
    const onChange = vi.fn();
    render(<F.RangeSlider label="Budget" defaultValue={[20, 60]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Minimum'), { target: { value: '90' } });
    expect(onChange).toHaveBeenLastCalledWith([60, 60]);
  });

  it('Rating selects', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.Rating label="Rate" onChange={onChange} />);
    await user.click(screen.getByLabelText('4 stars'));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});

describe('dropdowns', () => {
  it('works with the keyboard and skips disabled options', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.Dropdown label="Pick" options={options} onChange={onChange} name="pick" />);
    await user.tab();
    const trigger = screen.getByRole('combobox', { name: 'Pick' });
    expect(trigger).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('listbox')).toBeVisible();
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('c');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(trigger).toHaveTextContent('Gamma');
    expect(document.querySelector('input[name=pick]')).toHaveValue('c');
  });

  it('closes with Escape and outside click, and jumps by typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.Dropdown label="Pick" options={options} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    await user.click(screen.getByRole('combobox'));
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
    screen.getByRole('combobox').focus();
    await user.keyboard('ga{Enter}');
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('does not choose a disabled option or open when read-only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<F.Dropdown label="Pick" options={options} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Beta' }));
    expect(onChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    rerender(<F.Dropdown label="Pick" options={options} readOnly />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('Combobox filters, clears, and calls blur once it is left', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(
      <>
        <F.Combobox label="Pick" options={options} onChange={onChange} onBlur={onBlur} />
        <button>next</button>
      </>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Pick' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'gam{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('c');
    expect(onBlur).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    await user.click(screen.getByText('next'));
    expect(onBlur).toHaveBeenCalled();
  });

  it('Combobox loads from a server and can retry', async () => {
    const user = userEvent.setup();
    const load = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue([{ value: 'z', label: 'Zeta' }]);
    const onChange = vi.fn();
    render(<F.Combobox label="Pick" loadOptions={load} onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Pick' }));
    await user.click(await screen.findByRole('button', { name: 'Try again' }));
    await user.click(await screen.findByRole('option', { name: 'Zeta' }));
    expect(onChange).toHaveBeenCalledWith('z');
    expect(screen.getByRole('combobox', { name: 'Pick' })).toHaveTextContent('Zeta');
  });

  it('Combobox can create', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.Combobox label="Pick" options={options} onChange={onChange} onCreate={(t) => ({ value: t, label: t })} />);
    await user.click(screen.getByRole('combobox', { name: 'Pick' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'New one{Enter}');
    expect(onChange).toHaveBeenCalledWith('New one');
  });

  it('MultiDropdown selects, limits, removes and selects all', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Held<string[]> start={[]} onValue={onValue}>
        {(v, set) => <F.MultiDropdown label="Many" options={options} selectAll value={v} onChange={set} />}
      </Held>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Many' }));
    await user.click(screen.getByRole('option', { name: 'Select all' }));
    expect(onValue).toHaveBeenLastCalledWith(['a', 'c']);
    await user.click(screen.getByRole('button', { name: 'Remove Alpha' }));
    expect(onValue).toHaveBeenLastCalledWith(['c']);
  });

  it('TreeSelect selects a whole branch', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <F.TreeSelect label="Teams" onChange={onChange}
        nodes={[{ value: 'e', label: 'Eng', children: [{ value: 'f', label: 'Front' }, { value: 'b', label: 'Back' }] }]} />,
    );
    await user.click(screen.getByRole('combobox', { name: 'Teams' }));
    await user.keyboard('{ArrowRight}{Enter}');
    expect(onChange).toHaveBeenCalledWith(['f', 'b']);
  });

  it('TimezoneSelect finds current and old names', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.TimezoneSelect label="Zone" onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Zone' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'kolkata{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('Asia/Kolkata');
    const zones = F.getTimezones().map((z) => z.zone);
    expect(zones).toContain('UTC');
    expect(new Set(zones).size).toBe(zones.length);
  });

  it('TransferList moves items', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.TransferList label="Access" options={options} onChange={onChange} />);
    await user.click(within(screen.getByRole('group', { name: 'Available' })).getByLabelText('Alpha'));
    await user.click(screen.getByRole('button', { name: 'Add selected' }));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });
});

describe('dates', () => {
  it('DatePicker reads typing, rejects wrong dates and keeps limits', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Held<string | null> start={null} onValue={onValue}>
        {(v, set) => <F.DatePicker label="Day" value={v} onChange={set} max="2026-12-31" locale="en-GB" />}
      </Held>,
    );
    const box = screen.getByLabelText('Day');
    await user.type(box, '5/3/2026');
    await user.tab();
    expect(onValue).toHaveBeenLastCalledWith('2026-03-05');
    expect(box).toHaveValue('05/03/2026');
    await user.clear(box);
    await user.type(box, '31/02/2026');
    await user.tab();
    expect(screen.getByText(/Enter a date like/)).toBeVisible();
    expect(onValue).toHaveBeenLastCalledWith(null);
    await user.clear(box);
    await user.type(box, '01/01/2027');
    await user.tab();
    expect(screen.getByText('This date is not available')).toBeVisible();
  });

  it('DatePicker calendar works with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.DatePicker label="Day" defaultValue="2026-03-31" onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    await waitFor(() => expect(screen.getByRole('button', { name: /March 31, 2026/ })).toHaveFocus());
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: /April 1, 2026/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('2026-04-01');
  });

  it('DateRangePicker orders the two days', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.DateRangePicker label="Leave" defaultValue={{ start: '2026-03-10', end: '2026-03-12' }} onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'Leave' }));
    await user.click(screen.getByRole('button', { name: /March 20, 2026/ }));
    await user.click(screen.getByRole('button', { name: /March 15, 2026/ }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));
    expect(onChange).toHaveBeenCalledWith({ start: '2026-03-15', end: '2026-03-20' });
  });

  it('TimePicker finds a typed time', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.TimePicker label="At" onChange={onChange} />);
    await user.click(screen.getByRole('combobox', { name: 'At' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), '1430{Enter}');
    expect(onChange).toHaveBeenCalledWith('14:30');
  });

  it('DateTimePicker joins both parts', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<F.DateTimePicker label="Meet" onChange={onChange} locale="en-GB" />);
    await user.type(screen.getByLabelText('Date'), '05/03/2026');
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('combobox', { name: 'Time' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), '0900{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('2026-03-05T09:00');
  });

  it('MonthPicker and YearPicker give their values', async () => {
    const user = userEvent.setup();
    const month = vi.fn();
    const year = vi.fn();
    render(
      <>
        <F.MonthPicker label="Month" defaultValue="2026-01" onChange={month} />
        <F.YearPicker label="Year" minYear={2000} maxYear={2030} onChange={year} />
      </>,
    );
    await user.click(screen.getByRole('combobox', { name: 'Month' }));
    await user.click(screen.getByRole('button', { name: 'May 2026' }));
    expect(month).toHaveBeenCalledWith('2026-05');
    await user.click(screen.getByRole('combobox', { name: 'Year' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), '2020{Enter}');
    expect(year).toHaveBeenCalledWith(2020);
  });
});

describe('location', () => {
  it('PhoneInput gives E.164 and changes country', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Held start="" onValue={onValue}>
        {(v, set) => <F.PhoneInput label="Phone" defaultCountry="IN" value={v} onChange={set} />}
      </Held>,
    );
    await screen.findByRole('combobox', { name: 'Country code' });
    await user.type(screen.getByLabelText('Phone'), '9876543210');
    expect(onValue).toHaveBeenLastCalledWith('+919876543210');
    expect(await F.phoneRule()('+919876543210')).toBe(true);
    expect(await F.phoneRule('Wrong')('+9198')).toBe('Wrong');
    expect(await F.phoneRule()('')).toBe(true);
    await user.click(screen.getByRole('combobox', { name: 'Country code' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'United Kingdom{Enter}');
    expect(onValue).toHaveBeenLastCalledWith('+449876543210');
  });

  it('PhoneInput reads a pasted international number', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Held start="" onValue={onValue}>
        {(v, set) => <F.PhoneInput label="Phone" defaultCountry="US" value={v} onChange={set} />}
      </Held>,
    );
    await screen.findByRole('combobox', { name: 'Country code' });
    await user.click(screen.getByLabelText('Phone'));
    await user.paste('+44 20 7946 0958');
    expect(onValue).toHaveBeenLastCalledWith('+442079460958');
    expect(screen.getByRole('combobox', { name: 'Country code' })).toHaveTextContent('GB +44');
  });

  it('CountrySelect has every country', async () => {
    const user = userEvent.setup();
    render(<F.CountrySelect label="Country" preferred={['IN']} />);
    await user.click(screen.getByRole('combobox', { name: 'Country' }));
    const all = screen.getAllByRole('option');
    expect(all).toHaveLength(249);
    expect(all[0]).toHaveTextContent('India');
  });

  it('AddressFields loads states and resets them with the country', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Held<F.Address> start={{ ...F.emptyAddress, country: 'IN' }} onValue={onValue}>
        {(v, set) => <F.AddressFields value={v} onChange={set} />}
      </Held>,
    );
    const state = await screen.findByRole('combobox', { name: 'State / region' });
    await waitFor(() => expect(screen.queryByText('Loading')).toBeNull());
    await user.click(state);
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'Tamil{Enter}');
    expect(onValue.mock.lastCall?.[0].state).toBe('TN');
    await user.click(screen.getByRole('combobox', { name: 'Country' }));
    await user.type(screen.getByRole('combobox', { name: 'Search' }), 'Canada{Enter}');
    expect(onValue.mock.lastCall?.[0]).toMatchObject({ country: 'CA', state: null, city: null });
  });
});

describe('choices', () => {
  it('Checkbox, Switch, RadioGroup and CheckboxGroup change', async () => {
    const user = userEvent.setup();
    const a = vi.fn(), b = vi.fn(), c = vi.fn(), d = vi.fn();
    render(
      <>
        <F.Checkbox label="Agree" onChange={a} />
        <F.Switch label="Alerts" onChange={b} />
        <F.RadioGroup label="One" options={options} onChange={c} />
        <F.CheckboxGroup label="Some" options={[{ value: 1, label: 'First' }, { value: 2, label: 'Second' }]} selectAll onChange={d} />
      </>,
    );
    await user.click(screen.getByLabelText('Agree'));
    await user.click(screen.getByRole('switch', { name: 'Alerts' }));
    await user.click(screen.getByLabelText('Gamma'));
    await user.click(screen.getByLabelText('Select all'));
    expect(a).toHaveBeenCalledWith(true);
    expect(b).toHaveBeenCalledWith(true);
    expect(c).toHaveBeenCalledWith('c');
    expect(d).toHaveBeenCalledWith([1, 2]);
  });
});

describe('files and color', () => {
  const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' });

  it('FileUpload rejects wrong files and keeps good ones', async () => {
    const onChange = vi.fn();
    render(<F.FileUpload label="Docs" multiple maxFiles={2} maxSize={5} accept=".pdf" onChange={onChange} />);
    const big = new File(['0123456789'], 'big.pdf', { type: 'application/pdf' });
    const text = new File(['x'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Docs'), { target: { files: [pdf, big, text] } });
    expect(onChange).toHaveBeenCalledWith([pdf]);
    expect(screen.getByText('big.pdf: must be 5 B or smaller')).toBeVisible();
    expect(screen.getByText('a.txt: this file type is not allowed')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('FileUpload retries a failed upload', async () => {
    const upload = vi.fn().mockRejectedValueOnce(new Error('Network down')).mockResolvedValue(undefined);
    render(<F.FileUpload label="Docs" upload={upload} />);
    fireEvent.change(screen.getByLabelText('Docs'), { target: { files: [pdf] } });
    expect(await screen.findByText('Network down')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(await screen.findByText(/Uploaded/)).toBeInTheDocument();
  });

  it('ColorPicker accepts short hex', async () => {
    const onChange = vi.fn();
    render(<F.ColorPicker label="Color" onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Color'), '#0af');
    expect(onChange).toHaveBeenLastCalledWith('#00aaff');
  });
});

describe('form', () => {
  interface Values {
    email: string;
    role: string | null;
  }
  function Demo({ onSubmit }: { onSubmit: (v: Values) => Promise<void> }) {
    const form = useForm<Values>({ defaultValues: { email: '', role: null } });
    return (
      <Form form={form} onSubmit={onSubmit}>
        <FormField control={form.control} name="email" rules={{ required: 'Enter your email' }}
          render={(field) => <F.Input {...field} label="Email" />} />
        <FormField control={form.control} name="role" rules={{ required: 'Select a role' }}
          render={(field) => <F.Dropdown {...field} label="Role" options={options} />} />
        <FormActions submitLabel="Save" />
      </Form>
    );
  }

  it('shows errors, focuses the first, then submits', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<Demo onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter your email')).toBeVisible();
    expect(screen.getByText('Select a role')).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toEqual({ email: 'a@b.co', role: 'a' });
  });

  it('puts server errors below fields and the rest on top', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new FormSubmitError('', { email: 'Already used' }))
      .mockRejectedValueOnce(new Error('Server is down'))
      .mockResolvedValue(undefined);
    render(<Demo onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('Email'), 'a@b.co');
    await user.click(screen.getByRole('combobox', { name: 'Role' }));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Already used')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Server is down');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });
});
