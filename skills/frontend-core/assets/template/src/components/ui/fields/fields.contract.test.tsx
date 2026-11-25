import { render, screen } from '@testing-library/react';
import { createElement, type ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import * as F from './index';
import { PhoneControl } from './location/PhoneControl';

// The same promises are checked on every field.
const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyField = ComponentType<any>;
const named: [string, AnyField, object?][] = [
  ['Input', F.Input],
  ['PasswordInput', F.PasswordInput],
  ['SearchInput', F.SearchInput],
  ['Textarea', F.Textarea],
  ['MaskedInput', F.MaskedInput, { mask: '##-##' }],
  ['OtpInput', F.OtpInput],
  ['TagsInput', F.TagsInput],
  ['NumberInput', F.NumberInput],
  ['CurrencyInput', F.CurrencyInput],
  ['PercentInput', F.PercentInput],
  ['Slider', F.Slider],
  ['Dropdown', F.Dropdown, { options }],
  ['Combobox', F.Combobox, { options }],
  ['MultiDropdown', F.MultiDropdown, { options }],
  ['TreeSelect', F.TreeSelect, { nodes: options }],
  ['TimezoneSelect', F.TimezoneSelect],
  ['CurrencySelect', F.CurrencySelect],
  ['LanguageSelect', F.LanguageSelect],
  ['DatePicker', F.DatePicker],
  ['DateRangePicker', F.DateRangePicker],
  ['TimePicker', F.TimePicker],
  ['MonthPicker', F.MonthPicker],
  ['YearPicker', F.YearPicker],
  ['CountrySelect', F.CountrySelect],
  ['CountryMultiSelect', F.CountryMultiSelect],
  ['StateSelect', F.StateSelect, { country: null }],
  ['CitySelect', F.CitySelect, { country: 'US', state: null }],
  ['PhoneInput while loading', F.PhoneInput],
  ['PhoneInput', PhoneControl],
  ['FileUpload', F.FileUpload],
  ['ImageUpload', F.ImageUpload],
  ['ColorPicker', F.ColorPicker],
  ['Checkbox', F.Checkbox],
  ['Switch', F.Switch],
];
const grouped: [string, AnyField, string, object?][] = [
  ['RadioGroup', F.RadioGroup, 'radiogroup', { options }],
  ['Rating', F.Rating, 'radiogroup'],
  ['CheckboxGroup', F.CheckboxGroup, 'group', { options }],
  ['RangeSlider', F.RangeSlider, 'group'],
  ['TransferList', F.TransferList, 'group', { options }],
  ['DateTimePicker', F.DateTimePicker, 'group'],
  ['SignaturePad', F.SignaturePad, 'group'],
];

const messages = { label: 'My field', helperText: 'Some help', error: 'It is wrong' };

describe.each(named)('%s', (_name, Field, extra = {}) => {
  it('connects label, error and helper to its control', () => {
    render(createElement(Field, { ...messages, ...extra }));
    const control = screen.getByLabelText('My field');
    expect(screen.getByText('It is wrong')).toBeVisible();
    expect(control).toHaveAccessibleDescription(/It is wrong.*Some help/);
    expect(control).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows the required mark and several errors', () => {
    const { container } = render(
      createElement(Field, { ...extra, label: 'My field', required: true, error: ['One', 'Two'] }),
    );
    expect(container).toHaveTextContent('My field *');
    expect(screen.getByText('One')).toBeVisible();
    expect(screen.getByText('Two')).toBeVisible();
  });

  it('can be disabled', () => {
    render(createElement(Field, { ...extra, label: 'My field', disabled: true }));
    expect(screen.getByLabelText('My field')).toBeDisabled();
  });

  it('has no error state without an error', () => {
    render(createElement(Field, { ...extra, label: 'My field' }));
    expect(screen.getByLabelText('My field')).not.toHaveAttribute('aria-invalid');
  });

  it('gives its ref to a focusable control', () => {
    let node: HTMLElement | null = null;
    render(
      createElement(Field, {
        ...extra,
        label: 'My field',
        ref: (n: HTMLElement | null) => {
          if (n) node = n;
        },
      }),
    );
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node).toBe(screen.getByLabelText('My field'));
  });
});

describe.each(grouped)('%s', (_name, Field, role, extra = {}) => {
  it('connects label, error and helper to its group', () => {
    render(createElement(Field, { ...messages, ...extra }));
    const group = screen.getByRole(role, { name: /My field/ });
    expect(group).toHaveAccessibleDescription(/It is wrong.*Some help/);
  });

  it('disables every control', () => {
    const { container } = render(createElement(Field, { ...extra, label: 'My field', disabled: true }));
    const enabled = container.querySelectorAll('input:not(:disabled):not([type=hidden]), button:not(:disabled)');
    expect([...enabled]).toEqual([]);
  });
});

it('never renders native picker elements', () => {
  const { container } = render(
    <>
      {named.map(([name, Field, extra]) => createElement(Field, { key: name, label: name, ...extra }))}
    </>,
  );
  expect(container.querySelectorAll('select, datalist, input[type=date], input[type=time], input[type=color]')).toHaveLength(0);
});
