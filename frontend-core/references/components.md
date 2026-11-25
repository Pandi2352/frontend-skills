# Components

Finished and tested code is in the template. **Use it, do not rewrite it.** Live
examples: `src/app/pages/ComponentsPlayground.tsx`. Fields: `fields-and-forms.md`.
Sidebar and navbar: `app-shell.md`. All words are in `constants/ui-text.ts`.

`AppProviders` mounts `Toaster`, `ConfirmProvider` and an `ErrorBoundary` once,
around the router.

## Button

`<Button variant="primary|secondary|outline|ghost|danger|link" size="sm|md|lg" isLoading leftIcon rightIcon fullWidth>`
and `<IconButton icon label>`. Heights match the fields. Navigation uses a link,
not a button.

## Toaster

```ts
import { toast } from '@/components/ui/toast';     // works anywhere, also in services

toast.success('User saved', { description: 'All changes are stored' });
toast.error('Could not save');                     // stays until dismissed
toast.info('Archived', { action: { label: 'Undo', onClick: restore } });
const id = toast.loading('Uploading…');
toast.update(id, { type: 'success', message: 'Uploaded' });
await toast.promise(save(), { loading: 'Saving…', success: 'Saved', error: getErrorMessage });
toast.dismiss(id);
```

Built in: queue (3 visible), equal ones merged, pause on hover, focus and hidden
tab, swipe, screen reader announcement, above modals. Never for field errors or
as the only copy of important information.

## Loaders

| Use | For |
| --- | --- |
| `TextSkeleton`, `CardSkeleton`, `TableSkeleton`, `FormSkeleton`, `PageSkeleton`, `Skeleton` | first load with a known layout |
| `PageLoader` | app start, session restore |
| `SectionLoader` | one card without a known layout |
| `LoadingOverlay active` | blocks a form while saving |
| `TopProgressBar active` | page change |
| `Progress label value` | known percentage; without `value` it is indeterminate |
| `Spinner size label` | inside buttons and small areas |

`useDelayedLoading(isLoading)` shows after 200ms and stays 300ms, so nothing
flickers. Overlay, bar, `AsyncView` and `DataTable` already use it.

## Modal, Drawer, Confirm

```tsx
const modal = useDisclosure();
<Modal open={modal.isOpen} onClose={modal.close} title="Edit user" size="sm|md|lg|xl|full"
  busy={isSaving} beforeClose={() => !isDirty || confirm({ title: 'Discard changes?' })}
  footer={<><Button variant="outline" onClick={modal.close}>Cancel</Button><Button>Save</Button></>}>
  …fields, dropdowns and date pickers work inside…
</Modal>
<Drawer side="left|right|bottom" size="sm|md|lg" … />

const confirm = useConfirm();
if (await confirm({ title: 'Delete user?', message: 'This cannot be undone.', confirmLabel: 'Delete',
  variant: 'danger', requireText: 'DELETE', onConfirm: () => remove(id) })) toast.success('Deleted');
```

Built in: focus trap and return, Escape, outside press, scroll lock, nesting.
`dismissible={false}`, `hideClose`, `fullScreenOnMobile`, `initialFocus`.
`onConfirm` shows a spinner; a failure is shown and keeps the dialog open.

## Menu and tooltip

```tsx
<DropdownMenu items={[{ label: 'Edit', icon: Pencil, onSelect: edit }, { kind: 'separator' },
  { label: 'Delete', icon: Trash2, danger: true, onSelect: remove }]}
  trigger={(props) => <Button {...props}>More</Button>} />
<Tooltip text="Copies the link"><IconButton icon={Copy} label="Copy" /></Tooltip>
```

Items: `href`, `disabled`, `shortcut`, `description`, `checked` (stays open),
`{ kind: 'label' }`. Tooltip never holds essential information.

## Data table

```tsx
const [state, setState] = useTableState();          // page, size, search, sort in the URL
const users = useUsers(state);
const columns: Column<User>[] = [
  { id: 'name', header: 'Name', value: (u) => u.name, sortable: true, hideable: false },
  { id: 'status', header: 'Status', value: (u) => u.status, cell: (u) => <Badge>{u.status}</Badge> },
];
<DataTable caption="Users" columns={columns} getRowId={(u) => u.id} getRowName={(u) => u.name}
  mode="server" data={users.data?.items} total={users.data?.total} state={state} onStateChange={setState}
  isLoading={users.isLoading} isFetching={users.isFetching}
  error={users.error ? getErrorMessage(users.error) : undefined} onRetry={users.refetch}
  selectable bulkActions={(ids, clear) => …} rowActions={(u) => [{ label: 'Edit', onSelect: … }]}
  mobile="cards" exportName="users" />
```

| Prop | Use |
| --- | --- |
| `mode` | `client` searches, sorts and pages here; `server` leaves it to the API |
| `value` / `cell` | plain value for sort, search, export / what is shown |
| `toolbar`, `isFiltered`, `onClearFilters` | outside filters |
| `selectable`, `selected`, `onSelectedChange`, `bulkActions` | selection across pages |
| `rowActions`, `renderDetails` | menu per row, expandable row |
| `columnPicker`, `exportName` | show/hide columns and density, CSV (safe in Excel) |
| `mobile` | `scroll` or `cards` |
| `scrollClassName="max-h-96"` | sticky header |
| `virtual` | draws only visible rows, for more than 200 at once; give columns a width |
| `empty`, `pageSizes`, `hidePagination`, `searchable` | others |

In server mode export covers only the loaded rows; large exports belong to the
server. `FilterBar` above the table: fields in a row, drawer on phones, chips.
Keep `columns`, `rowActions`, `getRowId` and `renderDetails` outside the component
(or memoized), so a click draws one row and not all. Not included: column resize,
pinning, inline edit; use TanStack Table when really needed. `Pagination` also works alone.

## States and display

- `AsyncView data isLoading error onRetry isEmpty` picks loader, error, empty or
  content, and keeps content when a refresh fails.
- `EmptyState`, `NoResults`, `ErrorState reference`, `OfflineBanner`.
- `ErrorBoundary resetKey onError` around app, routes and risky widgets.
- `Alert variant title action onDismiss`, `Badge variant size icon`,
  `Avatar name src size`, `PageHeader`, `Breadcrumb`.

## Not in the template yet

Build as shared when first needed, with the contract in `must-have.md`: Tabs,
Accordion, Stepper, CommandMenu, Card, StatCard, KeyValueList, Timeline,
ActivityFeed, Gallery, charts, submenus.

- Tabs: arrow keys, disabled, URL sync, scroll on phones.
- Accordion: button with `aria-expanded`, one or many open.
- Stepper: complete, current and error, keeps values.
- Command menu: search, groups, recent, keyboard; opens from `NavbarSearch`.
- Charts: title, legend, loading, empty, text alternative.
