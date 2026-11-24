import { Mail, User } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Form, FormActions, FormField, FormSection, FormSubmitError, RepeatableFields, nestedMessages,
} from '@/components/form';
import * as F from '@/components/ui/fields';

// Every field with a real form. Copy the block you need.
// Route this page in development only.

const roles: F.Option[] = [
  { value: 'admin', label: 'Admin', description: 'Full access', group: 'Staff' },
  { value: 'editor', label: 'Editor', description: 'Can edit content', group: 'Staff' },
  { value: 'viewer', label: 'Viewer', group: 'Guests' },
  { value: 'owner', label: 'Owner', group: 'Guests', disabled: true },
];
const skills: F.Option[] = ['React', 'TypeScript', 'CSS', 'Testing', 'Design'].map((label) => ({
  value: label.toLowerCase(),
  label,
}));
const plans: F.Option[] = [
  { value: 'basic', label: 'Basic', description: '1 user' },
  { value: 'team', label: 'Team', description: 'Up to 10 users' },
  { value: 'business', label: 'Business', description: 'Unlimited' },
];
const tree: F.TreeNode[] = [
  { value: 'eng', label: 'Engineering', children: [{ value: 'fe', label: 'Frontend' }, { value: 'be', label: 'Backend' }] },
  { value: 'ops', label: 'Operations', children: [{ value: 'hr', label: 'HR' }, { value: 'fin', label: 'Finance' }] },
];

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

// Stand-in for a server search.
async function searchPeople(query: string): Promise<F.Option[]> {
  await wait(300);
  return ['Asha', 'Ben', 'Chen', 'Divya', 'Elena']
    .filter((n) => n.toLowerCase().includes(query.toLowerCase()))
    .map((label) => ({ value: label.toLowerCase(), label }));
}

interface Values {
  name: string;
  email: string;
  website: string;
  password: string;
  search: string;
  bio: string;
  card: string;
  otp: string;
  tags: string[];
  quantity: number | null;
  price: number | null;
  discount: number | null;
  volume: number;
  budget: [number, number];
  rating: number | null;
  role: string | null;
  skills: string[];
  person: string | null;
  label: string | null;
  teams: string[];
  access: string[];
  timezone: string | null;
  currency: string | null;
  language: string | null;
  birthday: string | null;
  leave: F.DateRange;
  startTime: string | null;
  meeting: string | null;
  month: string | null;
  year: number | null;
  phone: string;
  address: F.Address;
  countries: string[];
  terms: boolean;
  notify: string[];
  plan: string | null;
  view: string | null;
  darkMode: boolean;
  files: File[];
  avatar: File | string | null;
  signature: string | null;
  color: string | null;
  contacts: { email: string }[];
}

const defaults: Values = {
  name: '', email: '', website: '', password: '', search: '', bio: '', card: '', otp: '', tags: [],
  quantity: null, price: null, discount: null, volume: 40, budget: [20, 70], rating: null,
  role: null, skills: ['react'], person: null, label: null, teams: ['fe'], access: [],
  timezone: null, currency: null, language: null, birthday: null,
  leave: { start: null, end: null }, startTime: null, meeting: null, month: null, year: null,
  phone: '', address: F.emptyAddress, countries: [], terms: false, notify: ['email'], plan: 'basic',
  view: 'list', darkMode: false, files: [], avatar: null, signature: null, color: null,
  contacts: [{ email: '' }],
};

export function FieldsPlayground() {
  const form = useForm<Values>({ defaultValues: defaults, mode: 'onBlur' });
  const { control } = form;
  const [title, setTitle] = useState('Fields playground');
  const [saved, setSaved] = useState('');

  const save = async (values: Values) => {
    setSaved('');
    await wait(400);
    if (values.email === 'taken@example.com') {
      throw new FormSubmitError('', { email: 'This email is already registered' });
    }
    setSaved(JSON.stringify(values, null, 2));
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <Form form={form} onSubmit={save}>
        <FormSection title="Text" columns={2}>
          <FormField control={control} name="name" rules={{ required: 'Enter your name' }}
            render={(field) => <F.Input {...field} label="Name" required leftIcon={User} clearable placeholder="Full name" autoComplete="name" />} />
          <FormField control={control} name="email"
            rules={{ required: 'Enter your email', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter an email like name@example.com' } }}
            render={(field) => <F.Input {...field} type="email" label="Email" required leftIcon={Mail} helperText="We never share it" info="Used to sign in" />} />
          <FormField control={control} name="website"
            render={(field) => <F.Input {...field} type="url" label="Website" optionalText="(optional)" prefix="https://" suffix=".com" />} />
          <FormField control={control} name="password" rules={{ minLength: { value: 8, message: 'Use at least 8 characters' } }}
            render={(field) => <F.PasswordInput {...field} label="Password" showStrength rules={F.defaultPasswordRules} labelAction={<a href="#forgot" className="text-primary underline">Forgot?</a>} />} />
          <FormField control={control} name="search"
            render={(field) => <F.SearchInput {...field} label="Search" placeholder="Search orders" />} />
          <FormField control={control} name="card"
            render={(field) => <F.MaskedInput {...field} label="Card number" mask={F.masks.creditCard} autoComplete="cc-number" />} />
          <FormField control={control} name="otp"
            render={(field) => <F.OtpInput {...field} label="Verification code" />} />
          <FormField control={control} name="tags"
            render={(field) => <F.TagsInput {...field} label="Tags" maxTags={5} clearable />} />
          <FormField control={control} name="bio"
            render={(field) => <F.Textarea {...field} className="md:col-span-2" label="Bio" autoResize showCount maxLength={200} />} />
        </FormSection>

        <FormSection title="Numbers" columns={2}>
          <FormField control={control} name="quantity" rules={{ required: 'Enter a quantity' }}
            render={(field) => <F.NumberInput {...field} label="Quantity" required min={1} max={99} />} />
          <FormField control={control} name="price"
            render={(field) => <F.CurrencyInput {...field} label="Price" />} />
          <FormField control={control} name="discount"
            render={(field) => <F.PercentInput {...field} label="Discount" />} />
          <FormField control={control} name="rating"
            render={(field) => <F.Rating {...field} label="Rating" clearable />} />
          <FormField control={control} name="volume"
            render={(field) => <F.Slider {...field} label="Volume" marks={[0, 50, 100]} />} />
          <FormField control={control} name="budget"
            render={(field) => <F.RangeSlider {...field} label="Budget" formatValue={(n) => `$${n}`} />} />
        </FormSection>

        <FormSection title="Dropdowns" columns={2}>
          <FormField control={control} name="role" rules={{ required: 'Select a role' }}
            render={(field) => <F.Dropdown {...field} label="Role" required options={roles} clearable />} />
          <FormField control={control} name="skills"
            render={(field) => <F.MultiDropdown {...field} label="Skills" options={skills} selectAll searchable clearable />} />
          <FormField control={control} name="person"
            render={(field) => <F.Combobox {...field} label="Person (server search)" loadOptions={searchPeople} />} />
          <FormField control={control} name="label"
            render={(field) => <F.Combobox {...field} label="Label (can add)" options={skills} onCreate={(text) => ({ value: text, label: text })} />} />
          <FormField control={control} name="teams"
            render={(field) => <F.TreeSelect {...field} label="Teams" nodes={tree} clearable />} />
          <FormField control={control} name="timezone"
            render={(field) => <F.TimezoneSelect {...field} label="Time zone" />} />
          <FormField control={control} name="currency"
            render={(field) => <F.CurrencySelect {...field} label="Currency" />} />
          <FormField control={control} name="language"
            render={(field) => <F.LanguageSelect {...field} label="Language" />} />
          <FormField control={control} name="access"
            render={(field) => <F.TransferList {...field} className="md:col-span-2" label="Access" options={skills} />} />
        </FormSection>

        <FormSection title="Dates" columns={2}>
          <FormField control={control} name="birthday"
            render={(field) => <F.DatePicker {...field} label="Birthday" clearable max="2026-12-31" />} />
          <FormField control={control} name="leave"
            render={(field) => <F.DateRangePicker {...field} label="Leave" clearable presets={[{ label: 'First week of 2027', range: { start: '2027-01-01', end: '2027-01-07' } }]} />} />
          <FormField control={control} name="startTime"
            render={(field) => <F.TimePicker {...field} label="Start time" stepMinutes={30} clearable />} />
          <FormField control={control} name="meeting"
            render={(field) => <F.DateTimePicker {...field} label="Meeting" />} />
          <FormField control={control} name="month"
            render={(field) => <F.MonthPicker {...field} label="Month" clearable />} />
          <FormField control={control} name="year"
            render={(field) => <F.YearPicker {...field} label="Year" clearable />} />
        </FormSection>

        <FormSection title="Location" columns={2}>
          <FormField control={control} name="phone"
            rules={{ required: 'Enter a phone number', validate: (v) => F.isValidPhone(v) || 'Enter a valid phone number' }}
            render={(field) => <F.PhoneInput {...field} label="Phone" required clearable preferredCountries={['US', 'IN', 'GB']} />} />
          <FormField control={control} name="countries"
            render={(field) => <F.CountryMultiSelect {...field} label="Countries" maxChips={2} />} />
          <FormField control={control} name="address"
            rules={{ validate: (v) => !!v.line1 || 'Enter the address' }}
            render={(field, state) => (
              <F.AddressFields {...field} className="md:col-span-2" errors={nestedMessages(state.error)} />
            )} />
        </FormSection>

        <FormSection title="Choices" columns={2}>
          <FormField control={control} name="plan"
            render={(field) => <F.RadioGroup {...field} className="md:col-span-2" label="Plan" variant="card" direction="horizontal" options={plans} />} />
          <FormField control={control} name="notify"
            render={(field) => <F.CheckboxGroup {...field} label="Notify by" selectAll options={[{ value: 'email', label: 'Email' }, { value: 'sms', label: 'SMS' }]} />} />
          <FormField control={control} name="view"
            render={(field) => <F.RadioGroup {...field} label="View" variant="segmented" options={[{ value: 'list', label: 'List' }, { value: 'grid', label: 'Grid' }]} />} />
          <FormField control={control} name="darkMode"
            render={(field) => <F.Switch {...field} label="Dark mode" description="Applies immediately" />} />
          <FormField control={control} name="terms" rules={{ required: 'Accept the terms to continue' }}
            render={(field) => <F.Checkbox {...field} label="I accept the terms" required />} />
        </FormSection>

        <FormSection title="Files and others" columns={2}>
          <FormField control={control} name="files"
            render={(field) => <F.FileUpload {...field} label="Documents" multiple maxFiles={3} maxSize={2 * 1024 * 1024} accept="image/*,.pdf" />} />
          <FormField control={control} name="avatar"
            render={(field) => <F.AvatarUpload {...field} label="Photo" maxSize={1024 * 1024} />} />
          <FormField control={control} name="signature"
            render={(field) => <F.SignaturePad {...field} label="Signature" />} />
          <FormField control={control} name="color"
            render={(field) => <F.ColorPicker {...field} label="Brand color" clearable />} />
          <F.InlineEdit label="Page title (inline edit)" value={title} onSave={setTitle} validate={(v) => (v ? undefined : 'Enter a title')} />
          <RepeatableFields control={control} name="contacts" label="Contacts" itemLabel="Contact" newItem={{ email: '' }} min={1} max={4} reorder
            render={(i) => (
              <FormField control={control} name={`contacts.${i}.email`} rules={{ required: 'Enter an email' }}
                render={(field) => <F.Input {...field} type="email" label="Email" required />} />
            )} />
        </FormSection>

        <FormActions submitLabel="Save" onCancel={() => form.reset()} />
      </Form>

      <FormSection title="States" columns={3}>
        <F.Input label="Default" placeholder="Placeholder" />
        <F.Input label="Error" defaultValue="wrong" error={['First problem', 'Second problem']} />
        <F.Input label="Warning" defaultValue="check" warning="Please check this" />
        <F.Input label="Success" defaultValue="free-name" success="This name is available" />
        <F.Input label="Loading" defaultValue="checking" loading />
        <F.Input label="Disabled" defaultValue="cannot change" disabled />
        <F.Input label="Read only" defaultValue="look only" readOnly />
        <F.Input label="Small" size="sm" />
        <F.Input label="Large" size="lg" />
        <F.Dropdown label="Dropdown small" size="sm" options={skills} />
        <F.Dropdown label="Dropdown error" options={skills} error="Select one" />
        <F.Dropdown label="Dropdown disabled" options={skills} disabled />
        <F.Input label="Horizontal" layout="horizontal" className="md:col-span-3" helperText="Label on the left" />
      </FormSection>

      {saved && (
        <pre role="status" className="overflow-auto rounded-md border border-line bg-surface p-4 text-xs">
          {saved}
        </pre>
      )}
    </main>
  );
}
