#!/usr/bin/env node
// Writes code that follows the standards. Never overwrites a file.
//
//   node generate.mjs feature orders --fields "customer:text!, total:currency!, status:select(open|paid), dueOn:date, note:textarea"
//   node generate.mjs component shared/StatusDot
//   node generate.mjs page reports/SalesReport
//
// feature: types, service, query hooks, form, list, details, create and edit pages,
// routes and tests. Needs the frontend-api code. `!` means required. Types: text,
// textarea, email, url, phone, number, currency, percent, date, switch, country,
// select(a|b). Options: --singular order, --project <folder>, --dry

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    project: { type: 'string', default: '.' },
    fields: { type: 'string', default: 'name:text!' },
    singular: { type: 'string' },
    dry: { type: 'boolean', default: false },
  },
});
const [kind, name] = positionals;
const src = path.join(path.resolve(opt.project), 'src');
const fail = (message) => {
  console.error(message);
  process.exit(1);
};
if (!['feature', 'component', 'page'].includes(kind) || !name) {
  fail('Usage: node generate.mjs feature <name> --fields "..." | component <folder/Name> | page <feature/Name>');
}
if (!existsSync(src)) fail(`No src folder in ${path.resolve(opt.project)}`);

const words = (text) => text.replace(/([a-z\d])([A-Z])/g, '$1 $2').split(/[^A-Za-z\d]+/).filter(Boolean).map((w) => w.toLowerCase());
const pascal = (text) => words(text).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const camel = (text) => pascal(text).replace(/^./, (c) => c.toLowerCase());
const kebab = (text) => words(text).join('-');
const sentence = (text) => words(text).join(' ').replace(/^./, (c) => c.toUpperCase());

const written = [];
function write(file, text) {
  const full = path.join(src, file);
  if (existsSync(full)) return console.log(`kept   src/${file} (already exists)`);
  if (!opt.dry) {
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, text.trimStart());
  }
  written.push(file);
}

if (kind === 'component') {
  const folder = name.includes('/') ? name.slice(0, name.lastIndexOf('/')) : 'ui';
  const Name = pascal(name.split('/').at(-1));
  const base = `components/${folder}/${kebab(Name)}`;
  write(`${base}/${Name}.tsx`, `
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export type ${Name}Props = ComponentProps<'div'>;

export function ${Name}({ className, ...rest }: ${Name}Props) {
  return <div className={cn('rounded-md border border-line bg-surface', className)} {...rest} />;
}
`);
  write(`${base}/index.ts`, `export * from './${Name}';\n`);
  write(`${base}/${kebab(Name)}.test.tsx`, `
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ${Name} } from './index';

it('shows its content and passes native props', () => {
  render(<${Name} data-testid="it" className="p-4">Hello</${Name}>);
  expect(screen.getByTestId('it')).toHaveClass('p-4');
  expect(screen.getByText('Hello')).toBeVisible();
});
`);
  console.log(`Added src/${base}. Next: real props and states, a test for each, an example in ComponentsPlayground.`);
}

if (kind === 'page') {
  const [feature, page] = name.includes('/') ? name.split('/') : [name, name];
  const Name = pascal(page).replace(/Page$/, '');
  write(`features/${kebab(feature)}/pages/${Name}Page.tsx`, `
import { PageContainer, PageHeader } from '@/components/layout/page';

export function ${Name}Page() {
  return (
    <PageContainer>
      <PageHeader title="${sentence(Name)}" />
    </PageContainer>
  );
}
`);
  console.log(`\nAdd to config/routes.ts and the router:\n  { path: ROUTES.…, lazy: async () => ({ Component: (await import('@/features/${kebab(feature)}/pages/${Name}Page')).${Name}Page }) },`);
}

if (kind === 'feature') {
  if (!existsSync(path.join(src, 'services/api.ts'))) fail('src/services/api.ts is missing. Add the frontend-api code first.');
  const plural = kebab(name);
  const singular = kebab(opt.singular ?? plural.replace(/ies$/, 'y').replace(/(ss|x|ch|sh)es$/, '$1').replace(/([^s])s$/, '$1'));
  const Plural = pascal(plural);
  const One = pascal(singular);
  const many = camel(plural);
  const one = camel(singular);
  const keys = `${one}Keys`;
  const text = sentence(plural);
  const oneText = words(singular).join(' ');
  const hasGuard = existsSync(path.join(src, 'components/shared/unsaved-changes'));

  // Field, TypeScript type, start value, how it is shown.
  const KINDS = {
    text: ['Input', 'string', "''"],
    textarea: ['Textarea', 'string', "''"],
    email: ['Input', 'string', "''"],
    url: ['Input', 'string', "''"],
    phone: ['PhoneInput', 'string', "''"],
    number: ['NumberInput', 'number | null', 'null'],
    currency: ['CurrencyInput', 'number | null', 'null'],
    percent: ['PercentInput', 'number | null', 'null'],
    date: ['DatePicker', 'string | null', 'null'],
    switch: ['Switch', 'boolean', 'false'],
    country: ['CountrySelect', 'string | null', 'null'],
    select: ['Dropdown', '', 'null'],
  };
  const parts = opt.fields.split(/,(?![^(]*\))/).map((f) => f.trim()).filter(Boolean);
  const fields = parts.map((part) => {
    const match = /^(\w+)\s*(?::\s*(\w+)(?:\(([^)]+)\))?)?\s*(!)?$/.exec(part);
    if (!match) return fail(`Cannot read the field "${part}". Example: total:currency!`);
    const [, key, type = 'text', list, required] = match;
    if (!KINDS[type]) return fail(`Unknown type "${type}". Use: ${Object.keys(KINDS).join(', ')}`);
    if (type === 'select' && !list) return fail(`"${key}" needs choices: ${key}:select(open|paid)`);
    if (['id', 'createdAt'].includes(key)) return fail(`"${key}" is always there; leave it out.`);
    const [component, ts, start] = KINDS[type];
    const choices = list?.split('|').map((c) => c.trim()).filter(Boolean);
    return {
      key: camel(key), label: sentence(key), type, component, required: !!required, start, choices,
      ts: choices ? `${One}${pascal(key)} | null` : ts,
      Type: choices ? `${One}${pascal(key)}` : '',
      options: choices ? `${camel(key)}Options` : '',
    };
  });
  if (new Set(fields.map((f) => f.key)).size !== fields.length) fail('Two fields have the same name.');
  const title = fields.find((f) => f.type === 'text') ?? fields.find((f) => ['email', 'url'].includes(f.type));
  if (!title) fail('At least one text or email field is needed; it names each row.');
  const selects = fields.filter((f) => f.choices);
  const filter = selects[0];
  const uses = (...types) => fields.some((f) => types.includes(f.type));
  const dir = `features/${plural}`;

  write(`${dir}/types/${singular}.types.ts`, `
${selects.map((f) => `export const ${f.key}Values = [${f.choices.map((c) => `'${c}'`).join(', ')}] as const;
export type ${f.Type} = (typeof ${f.key}Values)[number];
`).join('')}
/** What the form edits. */
export interface ${One}Input {
${fields.map((f) => `  ${f.key}: ${f.ts};`).join('\n')}
}

export interface ${One} extends ${One}Input {
  id: string;
  createdAt: string;
}

export interface ${One}ListParams {
  page: number;
  pageSize: number;
  search: string;
  /** "name:asc" */
  sort?: string | undefined;
${filter ? `  ${filter.key}?: ${filter.Type} | undefined;\n` : ''}}
`.replace(/^\n+/, ''));

  write(`${dir}/services/${plural}.service.ts`, `
import { api } from '@/services/api';
import type { Paginated } from '@/types/api.types';
import type { ${One}, ${One}Input, ${One}ListParams } from '../types/${singular}.types';

const path = (id: string) => \`/${plural}/\${encodeURIComponent(id)}\`;

// If the server uses other names, translate them here and nowhere else.
export const ${many}Service = {
  list: (params: ${One}ListParams, signal?: AbortSignal) =>
    api.get<Paginated<${One}>>('/${plural}', { query: { ...params }, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<${One}>(path(id), { signal }),
  create: (input: ${One}Input) => api.post<${One}>('/${plural}', input),
  update: (id: string, input: ${One}Input) => api.patch<${One}>(path(id), input),
  remove: (id: string) => api.delete(path(id)),
};
`);

  write(`${dir}/hooks/use${Plural}.ts`, `
import { keepPreviousData, queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ${many}Service } from '../services/${plural}.service';
import type { ${One}Input, ${One}ListParams } from '../types/${singular}.types';

export const ${keys} = {
  all: ['${plural}'] as const,
  lists: () => [...${keys}.all, 'list'] as const,
  list: (params: ${One}ListParams) => [...${keys}.lists(), params] as const,
  detail: (id: string) => [...${keys}.all, 'detail', id] as const,
};

export const use${Plural} = (params: ${One}ListParams) =>
  useQuery({
    queryKey: ${keys}.list(params),
    queryFn: ({ signal }) => ${many}Service.list(params, signal),
    placeholderData: keepPreviousData,
  });

export const ${one}Query = (id: string) =>
  queryOptions({ queryKey: ${keys}.detail(id), queryFn: ({ signal }) => ${many}Service.get(id, signal) });

/** Creates, or updates when there is an id. */
export function useSave${One}(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ${One}Input) => (id ? ${many}Service.update(id, input) : ${many}Service.create(input)),
    onSuccess: (saved) => {
      client.setQueryData(${keys}.detail(saved.id), saved);
      return client.invalidateQueries({ queryKey: ${keys}.lists() });
    },
  });
}

export function useRemove${One}() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ${many}Service.remove(id),
    onSuccess: (_result, id) => {
      client.removeQueries({ queryKey: ${keys}.detail(id) });
      return client.invalidateQueries({ queryKey: ${keys}.lists() });
    },
  });
}
`);

  const shown = (f, value) => {
    if (f.type === 'select') return `${value} && ${f.key}Labels[${value}]`;
    if (f.type === 'switch') return `${value} ? 'Yes' : 'No'`;
    if (f.type === 'currency') return `formatMoney(${value})`;
    if (f.type === 'number' || f.type === 'percent') return f.type === 'number' ? value : `${value} === null ? null : \`\${${value}}%\``;
    if (f.type === 'date') return `formatDay(${value})`;
    if (f.type === 'country') return `${value} && countryName(${value})`;
    return value;
  };
  const helpers = [
    ...(uses('currency') ? [`export const formatMoney = (value: number | null) =>
  value === null ? null : new Intl.NumberFormat(appConfig.locale, { style: 'currency', currency: appConfig.currency }).format(value);`] : []),
    ...(uses('date') ? [`export const formatDay = (value: string | null) => value && formatIso(value.slice(0, 10), appConfig.locale, { dateStyle: 'medium' });`] : []),
  ];
  const labels = selects.map((f) => `export const ${f.key}Labels: Record<${f.Type}, string> = {
${f.choices.map((c) => `  ${/^[A-Za-z_]\w*$/.test(c) ? c : `'${c}'`}: '${sentence(c)}',`).join('\n')}
};
export const ${f.options} = ${f.key}Values.map((value) => ({ value, label: ${f.key}Labels[value] }));`);
  const hasDisplay = helpers.length + labels.length > 0;
  const displayNames = [
    ...(uses('currency') ? ['formatMoney'] : []), ...(uses('date') ? ['formatDay'] : []), ...selects.map((f) => `${f.key}Labels`),
  ];
  if (hasDisplay) {
    write(`${dir}/utils/${singular}-display.ts`, `
${uses('currency', 'date') ? "import { appConfig } from '@/config/app.config';\n" : ''}${uses('date') ? "import { formatIso } from '@/utils/date';\n" : ''}${selects.length ? `import { ${selects.map((f) => `${f.key}Values, type ${f.Type}`).join(', ')} } from '../types/${singular}.types';\n` : ''}
${[...helpers, ...labels].join('\n\n')}
`);
  }

  const fieldJsx = (f) => {
    const rules = [
      ...(f.required && f.type !== 'switch' ? [`required: '${f.type === 'select' || f.type === 'date' || f.type === 'country' ? 'Choose' : 'Enter'} the ${f.label.toLowerCase()}'`] : []),
      ...(f.type === 'email' ? ["pattern: { value: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, message: 'Enter a valid email address' }"] : []),
      ...(f.type === 'url' ? ["pattern: { value: /^https?:\\/\\/\\S+$/, message: 'Enter an address that starts with https://' }"] : []),
      ...(f.type === 'phone' ? ['validate: phoneRule()'] : []),
    ];
    const extra = [
      ...(f.type === 'email' ? ['type="email"'] : []),
      ...(f.type === 'url' ? ['type="url"'] : []),
      ...(f.type === 'select' ? [`options={${f.options}}`] : []),
      ...(f.required && f.type !== 'switch' ? ['required'] : ['select', 'date', 'country', 'phone'].includes(f.type) ? ['clearable'] : []),
      ...(f.type === 'textarea' ? ['className="md:col-span-2"'] : []),
    ];
    return `        <FormField control={form.control} name="${f.key}"${rules.length ? ` rules={{ ${rules.join(', ')} }}` : ''}
          render={(field) => <${f.component} {...field} label="${f.label}"${extra.length ? ` ${extra.join(' ')}` : ''} />} />`;
  };
  const components = [...new Set([...fields.map((f) => f.component), ...(uses('phone') ? ['phoneRule'] : [])])].sort();
  write(`${dir}/components/${One}Form.tsx`, `
import { useForm } from 'react-hook-form';
import { Form, FormActions, FormField, FormSection } from '@/components/form';
${hasGuard ? "import { UnsavedChangesGuard } from '@/components/shared/unsaved-changes';\n" : ''}import { ${components.join(', ')} } from '@/components/ui/fields';
import type { ${One}Input } from '../types/${singular}.types';
${selects.length ? `import { ${selects.map((f) => f.options).join(', ')} } from '../utils/${singular}-display';\n` : ''}
const empty: ${One}Input = {
${fields.map((f) => `  ${f.key}: ${f.start},`).join('\n')}
};

interface ${One}FormProps {
  /** Leave out to create. */
  initial?: ${One}Input;
  onSave: (input: ${One}Input) => Promise<unknown>;
  /** After saving. */
  onDone: () => void;
  onCancel: () => void;
}

/** Create and edit use the same form. Server errors reach their fields through Form. */
export function ${One}Form({ initial, onSave, onDone, onCancel }: ${One}FormProps) {
  const form = useForm<${One}Input>({ defaultValues: { ...empty, ...initial } });
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        await onSave(values);
        form.reset(values);
        onDone();
      }}
    >
${hasGuard ? '      <UnsavedChangesGuard />\n' : ''}      <FormSection columns={2}>
${fields.map(fieldJsx).join('\n')}
      </FormSection>
      <FormActions submitLabel={initial ? 'Save changes' : 'Create ${oneText}'} requireChanges={!!initial} onCancel={onCancel} />
    </Form>
  );
}
`);

  const order = ['email', 'select', 'currency', 'date', 'number', 'switch', 'phone', 'country', 'percent', 'text', 'url'];
  const others = fields.filter((f) => f !== title && f.type !== 'textarea').sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  const inTable = [title, ...others.slice(0, 4)];
  const column = (f) => {
    const numeric = ['number', 'currency', 'percent'].includes(f.type);
    const raw = `${one[0]}.${f.key}`;
    const value = shown(f, raw);
    const cell = f === title
      ? `, cell: (${one[0]}) => <Link to={ROUTES.${many}.details(${one[0]}.id)} className="font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-focus">{${raw}}</Link>`
      : f.type === 'select' ? `, cell: (${one[0]}) => (${raw} ? <Badge>{${f.key}Labels[${raw}]}</Badge> : '—')` : '';
    return `  { id: '${f.key}', header: '${f.label}', value: (${one[0]}) => ${value}${cell}, sortable: true${numeric ? ", align: 'end'" : ''}${f === title ? ', hideable: false' : ''} },`;
  };
  const tableHelpers = [
    ...(inTable.some((f) => f.type === 'currency') ? ['formatMoney'] : []), ...(inTable.some((f) => f.type === 'date') ? ['formatDay'] : []),
    ...inTable.filter((f) => f.choices).map((f) => `${f.key}Labels`), ...(filter ? [filter.options] : []),
  ];
  write(`${dir}/pages/${Plural}Page.tsx`, `
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { DataTable, ${filter ? 'FilterBar, ' : ''}useTableState, type Column } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/states';
${inTable.some((f) => f.type === 'select') ? "import { Badge } from '@/components/ui/badge';\n" : ''}import { Button } from '@/components/ui/button';
import type { MenuItem } from '@/components/ui/dropdown-menu';
${filter ? "import { Dropdown } from '@/components/ui/fields';\n" : ''}import { ROUTES } from '@/config/routes';
${filter ? "import { useUrlState } from '@/hooks/useUrlState';\n" : ''}${inTable.some((f) => f.type === 'country') ? "import { countryName } from '@/lib/locations';\n" : ''}import { getErrorMessage } from '@/services/api-error';
import { useDelete${One} } from '../hooks/useDelete${One}';
import { use${Plural} } from '../hooks/use${Plural}';
import ${filter ? `{ ${filter.key}Values, type ${filter.Type}, type ${One} }` : `type { ${One} }`} from '../types/${singular}.types';
${tableHelpers.length ? `import { ${tableHelpers.join(', ')} } from '../utils/${singular}-display';\n` : ''}
const columns: Column<${One}>[] = [
${inTable.map(column).join('\n')}
];
const getId = (${one[0]}: ${One}) => ${one[0]}.id;
const getName = (${one[0]}: ${One}) => ${one[0]}.${title.key};

export function ${Plural}Page() {
  const navigate = useNavigate();
  const [state, setState] = useTableState();
${filter ? `  const [${filter.key}, set${pascal(filter.key)}] = useUrlState<${filter.Type} | ''>('${filter.key}', '', ${filter.key}Values, ['page']);\n` : ''}  const remove = useDelete${One}();
  const list = use${Plural}({
    page: state.page,
    pageSize: state.pageSize,
    search: state.search,
    sort: state.sort ? \`\${state.sort.id}:\${state.sort.direction}\` : undefined,
${filter ? `    ${filter.key}: ${filter.key} || undefined,\n` : ''}  });

  const rowActions = useCallback(
    (${one[0]}: ${One}): MenuItem[] => [
      { label: 'Edit', icon: Pencil, onSelect: () => void navigate(ROUTES.${many}.edit(${one[0]}.id)) },
      { kind: 'separator' },
      { label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(${one[0]}) },
    ],
    [navigate, remove],
  );
  const createButton = <Button leftIcon={Plus} onClick={() => void navigate(ROUTES.${many}.create)}>New ${oneText}</Button>;

  return (
    <PageContainer>
      <PageHeader title="${text}" actions={createButton} />
${filter ? `      <FilterBar
        active={${filter.key} ? [{ id: '${filter.key}', label: \`${filter.label}: \${${filter.key}Labels[${filter.key}]}\`, onRemove: () => set${pascal(filter.key)}('') }] : []}
        onClearAll={() => set${pascal(filter.key)}('')}
      >
        <Dropdown label="${filter.label}" placeholder="Any" clearable options={${filter.options}} value={${filter.key} || null} onChange={(next) => set${pascal(filter.key)}(next ?? '')} />
      </FilterBar>
` : ''}      <DataTable
        caption="${text}"
        mode="server"
        columns={columns}
        data={list.data?.items}
        total={list.data?.total ?? 0}
        getRowId={getId}
        getRowName={getName}
        state={state}
        onStateChange={setState}
        isLoading={list.isPending}
        isFetching={list.isFetching}
        error={list.error ? getErrorMessage(list.error) : undefined}
        onRetry={() => void list.refetch()}
        rowActions={rowActions}
        mobile="cards"
        empty={<EmptyState title="No ${words(plural).join(' ')} yet" action={createButton} />}
${filter ? `        isFiltered={!!${filter.key}}\n        onClearFilters={() => set${pascal(filter.key)}('')}\n` : ''}      />
    </PageContainer>
  );
}
`.replace(filter && !inTable.includes(filter) ? `${filter.options} }` : '\u0000', filter ? `${filter.options}, ${filter.key}Labels }` : ''));

  write(`${dir}/hooks/useDelete${One}.ts`, `
import { useCallback } from 'react';
import { useConfirm } from '@/components/shared/confirm';
import { toast } from '@/components/ui/toast';
import type { ${One} } from '../types/${singular}.types';
import { useRemove${One} } from './use${Plural}';

/** Asks, deletes, and tells. Returns true when it is gone. A failure stays in the dialog. */
export function useDelete${One}() {
  const confirm = useConfirm();
  const { mutateAsync } = useRemove${One}();
  return useCallback(
    async (${one}: Pick<${One}, 'id' | '${title.key}'>) => {
      const gone = await confirm({
        title: \`Delete \${${one}.${title.key}}?\`,
        message: 'This cannot be undone.',
        confirmLabel: 'Delete',
        variant: 'danger',
        onConfirm: () => mutateAsync(${one}.id),
      });
      if (gone) toast.success(\`\${${one}.${title.key}} deleted\`);
      return gone;
    },
    [confirm, mutateAsync],
  );
}
`);

  write(`${dir}/pages/${One}DetailsPage.tsx`, `
import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { AsyncView } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { KeyValueList } from '@/components/ui/key-value-list';
import { FormSkeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/config/routes';
${uses('country') ? "import { countryName } from '@/lib/locations';\n" : ''}import { getErrorMessage } from '@/services/api-error';
import { useDelete${One} } from '../hooks/useDelete${One}';
import { ${one}Query } from '../hooks/use${Plural}';
${displayNames.length ? `import { ${displayNames.join(', ')} } from '../utils/${singular}-display';\n` : ''}
export function ${One}DetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const remove = useDelete${One}();
  const query = useQuery(${one}Query(id));
  const ${one} = query.data;

  return (
    <PageContainer>
      <PageHeader
        title={${one}?.${title.key} ?? '${sentence(singular)}'}
        backTo={ROUTES.${many}.list}
        actions={
          ${one} && (
            <>
              <Button variant="outline" leftIcon={Pencil} onClick={() => void navigate(ROUTES.${many}.edit(id))}>Edit</Button>
              <Button variant="danger" leftIcon={Trash2} onClick={async () => { if (await remove(${one})) await navigate(ROUTES.${many}.list, { replace: true }); }}>Delete</Button>
            </>
          )
        }
      />
      <Card>
        <AsyncView
          data={${one}}
          isLoading={query.isPending}
          error={query.error && getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          loader={<FormSkeleton />}
        >
          {(data) => (
            <KeyValueList
              items={[
${fields.map((f) => `                { label: '${f.label}', value: ${shown(f, `data.${f.key}`)}${f.type === 'textarea' ? ', wide: true' : ''} },`).join('\n')}
              ]}
            />
          )}
        </AsyncView>
      </Card>
    </PageContainer>
  );
}
`);

  write(`${dir}/pages/${One}FormPages.tsx`, `
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { AsyncView } from '@/components/shared/states';
import { Card } from '@/components/ui/card';
import { FormSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { ROUTES } from '@/config/routes';
import { getErrorMessage } from '@/services/api-error';
import { ${One}Form } from '../components/${One}Form';
import { ${one}Query, useSave${One} } from '../hooks/use${Plural}';

export function Create${One}Page() {
  const navigate = useNavigate();
  const save = useSave${One}();
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="New ${oneText}" backTo={ROUTES.${many}.list} />
      <Card>
        <${One}Form
          onSave={save.mutateAsync}
          onDone={() => {
            toast.success('${sentence(singular)} created');
            void navigate(ROUTES.${many}.list);
          }}
          onCancel={() => void navigate(ROUTES.${many}.list)}
        />
      </Card>
    </PageContainer>
  );
}

export function Edit${One}Page() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const save = useSave${One}(id);
  const query = useQuery(${one}Query(id));
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Edit ${oneText}" backTo={ROUTES.${many}.details(id)} />
      <Card>
        <AsyncView
          data={query.data}
          isLoading={query.isPending}
          error={query.error && getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
          loader={<FormSkeleton />}
        >
          {({ ${fields.map((f) => f.key).join(', ')} }) => (
            <${One}Form
              // Another id is another form.
              key={id}
              initial={{ ${fields.map((f) => f.key).join(', ')} }}
              onSave={save.mutateAsync}
              onDone={() => {
                toast.success('Changes saved');
                void navigate(ROUTES.${many}.details(id));
              }}
              onCancel={() => void navigate(ROUTES.${many}.details(id))}
            />
          )}
        </AsyncView>
      </Card>
    </PageContainer>
  );
}
`);

  write(`${dir}/${plural}.routes.ts`, `
import type { RouteObject } from 'react-router';
import { ROUTES } from '@/config/routes';

const { list, create } = ROUTES.${many};

export const ${many}Routes: RouteObject[] = [
  { path: list, lazy: async () => ({ Component: (await import('./pages/${Plural}Page')).${Plural}Page }) },
  { path: create, lazy: async () => ({ Component: (await import('./pages/${One}FormPages')).Create${One}Page }) },
  { path: \`\${list}/:id\`, lazy: async () => ({ Component: (await import('./pages/${One}DetailsPage')).${One}DetailsPage }) },
  { path: \`\${list}/:id/edit\`, lazy: async () => ({ Component: (await import('./pages/${One}FormPages')).Edit${One}Page }) },
];
`);
  write(`${dir}/index.ts`, `
export { ${many}Routes } from './${plural}.routes';
export { ${keys}, use${Plural} } from './hooks/use${Plural}';
export type * from './types/${singular}.types';
`);

  const sample = (f) => {
    if (f.choices) return `'${f.choices[0]}'`;
    return { email: "'a@example.com'", url: "'https://example.com'", phone: "'+14155552671'", number: '3', currency: '20', percent: '5', date: "'2026-01-05'", switch: 'true', country: "'US'" }[f.type] ?? `'${f.label} one'`;
  };
  const required = fields.find((f) => f.required && ['text', 'textarea', 'email', 'url'].includes(f.type));
  write(`${dir}/${plural}.test.tsx`, `
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { ConfirmProvider } from '@/components/shared/confirm';
import { ROUTES } from '@/config/routes';
import { ${many}Routes } from './index';
import { ${many}Service } from './services/${plural}.service';
import type { ${One} } from './types/${singular}.types';

vi.setConfig({ testTimeout: 30_000 });
vi.mock('./services/${plural}.service', () => ({
  ${many}Service: { list: vi.fn(), get: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));
const service = vi.mocked(${many}Service);
const row: ${One} = {
  id: '1',
  createdAt: '2026-01-05T10:00:00Z',
${fields.map((f) => `  ${f.key}: ${sample(f)},`).join('\n')}
};
// Lazy pages are slow the first time.
beforeAll(() => Promise.all(${many}Routes.map(({ lazy }) => typeof lazy === 'function' && lazy())), 60_000);
beforeEach(() => {
  vi.resetAllMocks();
  service.list.mockResolvedValue({ items: [row], total: 1, page: 1, pageSize: 10 });
  service.get.mockResolvedValue(row);
});

function start(path: string) {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ConfirmProvider>
        <RouterProvider router={createMemoryRouter(${many}Routes, { initialEntries: [path] })} />
      </ConfirmProvider>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

it('lists, and deletes after asking', async () => {
  const user = start(ROUTES.${many}.list);
  await user.click((await screen.findAllByRole('button', { name: \`Actions for \${row.${title.key}}\` }))[0] as HTMLElement);
  await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));
  expect(service.remove).not.toHaveBeenCalled();
  await user.click(await screen.findByRole('button', { name: 'Delete' }));
  await vi.waitFor(() => expect(service.remove).toHaveBeenCalledWith('1'));
});

it('shows an error with a retry', async () => {
  service.list.mockRejectedValueOnce(new Error('offline'));
  const user = start(ROUTES.${many}.list);
  await user.click(await screen.findByRole('button', { name: 'Try again' }));
  expect((await screen.findAllByText(row.${title.key}))[0]).toBeInTheDocument();
});

it('shows one, and opens the form', async () => {
  const user = start(ROUTES.${many}.details('1'));
  expect(await screen.findByRole('heading', { name: row.${title.key} })).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  expect(await screen.findByLabelText(/^${title.label}/)).toHaveValue(row.${title.key});
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
});
${required ? `
it('does not create without the required fields', async () => {
  const user = start(ROUTES.${many}.create);
  await user.click(await screen.findByRole('button', { name: 'Create ${oneText}' }));
  expect(await screen.findByText('Enter the ${required.label.toLowerCase()}')).toBeVisible();
  expect(service.create).not.toHaveBeenCalled();
});
` : ''}
it('saves a change', async () => {
  service.update.mockResolvedValue(row);
  const user = start(ROUTES.${many}.edit('1'));
  await user.type(await screen.findByLabelText(/^${title.label}/), 'x');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await vi.waitFor(() => expect(service.update).toHaveBeenCalledWith('1', expect.objectContaining({ ${title.key}: \`\${row.${title.key}}x\` })));
});
`);

  const routes = path.join(src, 'config/routes.ts');
  const current = existsSync(routes) ? readFileSync(routes, 'utf8') : '';
  const entry = `  ${many}: {
    list: '/${plural}',
    create: '/${plural}/new',
    details: (id: string) => \`/${plural}/\${encodeURIComponent(id)}\`,
    edit: (id: string) => \`/${plural}/\${encodeURIComponent(id)}/edit\`,
  },
`;
  if (new RegExp(`^  ${many}: `, 'm').test(current)) {
    console.log(`kept   ROUTES.${many} (make sure it has list, create, details and edit)`);
  } else if (current.includes('} as const;')) {
    if (!opt.dry) writeFileSync(routes, current.replace('} as const;', () => `${entry}} as const;`));
  } else console.log(`\nAdd to ROUTES:\n${entry}`);

  // Router and menu of projects made by create.mjs.
  const todo = [];
  const insert = (file, importLine, marker, line) => {
    const full = path.join(src, file);
    let content = existsSync(full) ? readFileSync(full, 'utf8').replaceAll('\r\n', '\n') : '';
    const at = new RegExp(`^([ \\t]*)// ${marker}$`, 'm').exec(content);
    if (!at) return false;
    if (content.includes(line)) return true;
    content = content.replace(at[0], () => `${at[1]}${line}\n${at[0]}`);
    if (importLine && !content.includes(importLine)) {
      const last = [...content.matchAll(/^import [^\n]*;$/gm)].at(-1);
      const end = last.index + last[0].length;
      content = `${content.slice(0, end)}\n${importLine}${content.slice(end)}`;
    }
    if (!opt.dry) writeFileSync(full, content);
    return true;
  };
  if (!insert('app/router/router.tsx', `import { ${many}Routes } from '@/features/${plural}';`, 'features', `...${many}Routes,`)) {
    todo.push(`router: add ...${many}Routes from '@/features/${plural}' inside the app layout`);
  }
  const item = `{ id: '${plural}', label: '${text}', to: ROUTES.${many}.list, icon: Folder },`;
  if (insert('config/navigation.ts', null, 'features', item)) {
    const full = path.join(src, 'config/navigation.ts');
    const content = readFileSync(full, 'utf8');
    if (!opt.dry && !/\bFolder\b[^;]*from 'lucide-react'/.test(content)) {
      writeFileSync(full, content.replace(/import \{ ([^}]*) \} from 'lucide-react';/, (_, names) => `import { ${[...names.split(', '), 'Folder'].sort().join(', ')} } from 'lucide-react';`));
    }
  } else todo.push(`menu: add ${item} to config/navigation.ts`);

  console.log(`Feature ${plural}: ${written.length} files in src/${dir}, paths${todo.length ? '' : ', route and menu item'} added.`);
  for (const line of todo) console.log(`  ${line}`);
  console.log(`Check: services/${plural}.service.ts (server paths and names), menu icon, permissions. Then: node scripts/verify.mjs --fast`);
}

// Keeps docs/COMPONENTS.md right.
const index = path.join(path.dirname(fileURLToPath(import.meta.url)), 'index-components.mjs');
if (!opt.dry && written.length && existsSync(index)) spawnSync(process.execPath, [index, path.resolve(opt.project)]);
