# Fields and forms

The code is finished and tested in `src/components/ui/fields` and
`src/components/form` (skill: `assets/template/src`). **Use it, do not rewrite
it.** Live examples of every field: `src/app/pages/FieldsPlayground.tsx`.

Contents: 1 usage, 2 common props, 3 every field, 4 forms, 5 rules, 6 new field.

## 1. Usage

```tsx
import { Input, PhoneInput, Dropdown } from '@/components/ui/fields';

<Input label="Email" type="email" required helperText="Work email" error={message} />
```

In a form, `{...field}` passes `value`, `onChange`, `onBlur`, `ref`, `name` and
`error`. Add only the label and options:

```tsx
const form = useForm<Values>({ defaultValues, mode: 'onBlur' });

<Form form={form} onSubmit={save}>
  <FormSection title="Profile" columns={2}>
    <FormField control={form.control} name="email" rules={{ required: 'Enter your email' }}
      render={(field) => <Input {...field} type="email" label="Email" required />} />
    <FormField control={form.control} name="role"
      render={(field) => <Dropdown {...field} label="Role" options={ROLES} />} />
  </FormSection>
  <FormActions submitLabel="Save" onCancel={close} />
</Form>
```

Every field needs a default value in `defaultValues` (see the Value column).

## 2. Props every field accepts

| Prop | Use |
| --- | --- |
| `label` | required; `hideLabel` hides it visually only |
| `required`, `optionalText` | `*` mark, "(optional)" |
| `helperText`, `info`, `labelAction` | help below, info icon, link beside label |
| `error` | a message or a list; turns on the error state |
| `warning`, `success` | shown when there is no error |
| `loading`, `disabled`, `readOnly` | states |
| `size` | `sm` 32px, `md` 40px (default), `lg` 48px |
| `layout` | `vertical`, `horizontal` |
| `className`, `controlClassName` | wrapper, control |
| `id`, `name`, `ref` | focus on first error works through `ref` |
| `value` / `defaultValue`, `onChange`, `onBlur` | controlled or not |

`AddressFields` is a group: it takes `errors` per part instead of `label`.
`Checkbox` and `Switch` place the label beside the control and take
`description`. `info`, `labelAction` and `optionalText` do not apply to them.

Text fields also accept `leftIcon`, `rightIcon`, `prefix`, `suffix`,
`clearable`, `maxLength`, `showCount` and native input attributes.

## 3. Every field

| Field | Value | Own features |
| --- | --- | --- |
| `Input` | string | `type` text, email, tel, url; `action`, `footer` |
| `PasswordInput` | string | show/hide, Caps Lock warning, `showStrength`, `rules` checklist |
| `SearchInput` | string | `onSearch` debounced, Enter, Escape clears |
| `Textarea` | string | `autoResize`, `maxRows`, `showCount`, `resize` |
| `MaskedInput` | raw string | `mask` or `masks.creditCard`, `cardExpiry`, `cvc`, ... |
| `OtpInput` | string | `length`, paste, autofill, `mask`, `onComplete` |
| `TagsInput` | string[] | Enter, comma, paste, duplicates, `maxTags`, `validateTag` |
| `InlineEdit` | string | `onSave` async, Enter saves, Escape cancels, `validate` |
| `NumberInput` | number or null | `min`, `max`, `step`, `precision`, stepper, arrow keys |
| `CurrencyInput` | number or null | `currency` sets symbol and decimals |
| `PercentInput` | number or null | 0 to 100 |
| `Slider`, `RangeSlider` | number, [low, high] | `marks`, `formatValue` |
| `Rating` | number or null | `max`, `clearable` |
| `Dropdown` | value or null | groups, icons, descriptions, disabled options, `clearable`, `searchable` |
| `Combobox` | value or null | Dropdown with search; `loadOptions` (server), `onCreate` |
| `MultiDropdown` | array | chips, `selectAll`, `max`, `maxChips`, search, server, create |
| `TreeSelect` | string[] | nested, search, partial state |
| `TransferList` | string[] | two lists with search |
| `TimezoneSelect`, `CurrencySelect`, `LanguageSelect` | code or null | lists built in |
| `DatePicker` | "YYYY-MM-DD" or null | type or calendar, `min`, `max`, `isDateDisabled`, locale |
| `DateRangePicker` | { start, end } | two months, `presets` |
| `TimePicker` | "HH:mm" or null | `stepMinutes`, `minTime`, `maxTime`, `hour12` |
| `DateTimePicker` | "YYYY-MM-DDTHH:mm" or null | local time without timezone |
| `MonthPicker`, `YearPicker` | "YYYY-MM", number, or null | limits |
| `PhoneInput` | "+919876543210" or "" | all country codes, formats while typing, paste; rule: `isValidPhone` |
| `CountrySelect`, `CountryMultiSelect` | "IN", ["IN"] | all 249, `preferred`, `only` |
| `StateSelect` | code or null | states of `country`; text box when there is no list |
| `CitySelect` | string or null | `loadCities` from your server; otherwise a text box |
| `AddressFields` | object, `emptyAddress` | country change resets state, city, postal code |
| `Checkbox` | boolean | `indeterminate`, `description` |
| `CheckboxGroup` | array | `columns`, `direction`, `selectAll`, `max` |
| `RadioGroup` | value or null | `variant` default, card, segmented |
| `Switch` | boolean | `description`, `spread`, pending with `loading` |
| `FileUpload` | File[] | drag, `multiple`, `accept`, `maxSize`, `maxFiles`, preview, `upload` with progress, retry, cancel; `existing`; `compact` |
| `ImageUpload`, `AvatarUpload` | File, URL or null | preview, replace, remove, shapes |
| `SignaturePad` | PNG data URL or null | draw or type a name |
| `ColorPicker` | "#2563eb" or null | hex, `swatches`, sliders |
| `RepeatableFields` (form) | array of rows | add, remove, reorder, `min`, `max` |

Not included because each needs a library or service to be chosen: rich text,
markdown, code editor, mentions, captcha, map, image crop.

## 4. Forms

- `Form` validates, focuses the first invalid field, blocks double submit.
- Server errors: throw `new FormSubmitError(message, { email: 'Already used' })`.
  Matching names appear below their fields; the rest appears at the top.
- Object fields: `render={(field, state) => <AddressFields {...field} errors={nestedMessages(state.error)} />}`.
- `FormActions` shows the spinner and cancels; `requireChanges` waits for edits.
- Create and edit share one form component through `defaultValues`.
- Same schema rules as the server; messages say how to fix the problem.
- Keep values after failure. Warn before leaving with unsaved changes.

## 5. Rules

- Never style a field locally. Change `base/field.styles.ts` or tokens.
- No `<select>`, `<datalist>`, native date, time or color inputs.
- All words the fields show are in `constants/field-text.ts`.
- Locale, currency, country and week start are in `config/app.config.ts`.
- Dates stay ISO strings; numbers stay numbers; empty is `null`, not `0`.
- Client validation never replaces server validation, including file types.

## 6. Adding a field

Use `useField` for ids, ARIA and state, `FieldShell` for label and messages,
`ControlFrame` for the box, `usePopup` and `PopupPanel` for a popup,
`useControllableState` for the value, `HiddenInputs` for plain forms. Then add
it to `index.ts`, to the list in `fields.contract.test.tsx`, and to the
playground.
