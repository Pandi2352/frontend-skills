import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { useConfirm } from '@/components/shared/confirm';
import { DataTable, FilterBar, useTableState, type Column } from '@/components/shared/data-table';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker, Dropdown, Input } from '@/components/ui/fields';
import { LoadingOverlay, Progress, SectionLoader, Spinner, TopProgressBar } from '@/components/ui/loader';
import { Drawer, Modal } from '@/components/ui/modal';
import { CardSkeleton, FormSkeleton, TextSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/useDisclosure';

// Every shared component. Route this page in development only.

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  age: number | null;
  active: boolean;
}

const people: Person[] = Array.from({ length: 57 }, (_, i) => ({
  id: String(i + 1),
  name: `${['Asha', 'Ben', 'Chen', 'Divya', 'Elena'][i % 5]} ${i + 1}`,
  email: `person${i + 1}@example.com`,
  role: ['Admin', 'Editor', 'Viewer'][i % 3] ?? '',
  age: i % 7 === 0 ? null : 20 + (i % 40),
  active: i % 4 !== 0,
}));

const columns: Column<Person>[] = [
  { id: 'name', header: 'Name', value: (p) => p.name, sortable: true, hideable: false },
  { id: 'email', header: 'Email', value: (p) => p.email },
  { id: 'role', header: 'Role', value: (p) => p.role, sortable: true },
  { id: 'age', header: 'Age', value: (p) => p.age, sortable: true, align: 'end' },
  {
    id: 'status', header: 'Status', value: (p) => (p.active ? 'Active' : 'Inactive'),
    cell: (p) => <Badge variant={p.active ? 'success' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge>,
  },
];

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));
const roles = ['Admin', 'Editor', 'Viewer'].map((r) => ({ value: r, label: r }));

export function ComponentsPlayground() {
  const confirm = useConfirm();
  const modal = useDisclosure();
  const drawer = useDisclosure();
  const [busy, setBusy] = useState(false);
  const [state, setState] = useTableState();
  const [role, setRole] = useState<string | null>(null);
  const rows = role ? people.filter((p) => p.role === role) : people;

  const remove = async (name: string) => {
    const yes = await confirm({
      title: `Delete ${name}?`,
      message: 'This cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: () => wait(600).then(() => undefined),
    });
    if (yes) toast.success(`${name} deleted`, { action: { label: 'Undo', onClick: () => toast.info('Restored') } });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Components"
        description="Every shared component"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Components' }]}
        badge={<Badge variant="info">Playground</Badge>}
        actions={<Button leftIcon={Plus}>New</Button>}
      />
      <TopProgressBar active={busy} />

      <section aria-label="Feedback" className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast.success('Saved', { description: 'All changes are stored' })}>Success toast</Button>
        <Button variant="outline" onClick={() => toast.error('Could not save')}>Error toast</Button>
        <Button variant="outline" onClick={() => void toast.promise(wait(1500), { loading: 'Uploading…', success: 'Uploaded', error: 'Failed' })}>Promise toast</Button>
        <Button variant="outline" onClick={modal.open}>Open modal</Button>
        <Button variant="outline" onClick={drawer.open}>Open drawer</Button>
        <Button variant="danger" leftIcon={Trash2} onClick={() => void remove('Project')}>Confirm</Button>
        <Tooltip text="Extra help"><Button variant="ghost">Tooltip</Button></Tooltip>
        <Button variant="outline" isLoading={busy} onClick={() => { setBusy(true); void wait(1500).then(() => setBusy(false)); }}>Load</Button>
      </section>

      <FilterBar active={role ? [{ id: 'role', label: `Role: ${role}`, onRemove: () => setRole(null) }] : []} onClearAll={() => setRole(null)}>
        <Dropdown label="Role" placeholder="Any role" options={roles} value={role} clearable onChange={setRole} />
      </FilterBar>

      <DataTable
        caption="People"
        columns={columns}
        data={rows}
        getRowId={(p) => p.id}
        getRowName={(p) => p.name}
        state={state}
        onStateChange={setState}
        mobile="cards"
        selectable
        exportName="people"
        isFiltered={!!role}
        onClearFilters={() => setRole(null)}
        bulkActions={(ids, clear) => <Button size="sm" variant="outline" onClick={() => { toast.info(`${ids.length} archived`); clear(); }}>Archive</Button>}
        rowActions={(p) => [
          { label: 'Edit', icon: Pencil, onSelect: modal.open },
          { kind: 'separator' },
          { label: 'Delete', icon: Trash2, danger: true, onSelect: () => void remove(p.name) },
        ]}
        renderDetails={(p) => `Contact: ${p.email}`}
      />

      <section aria-label="Loaders" className="grid items-start gap-4 md:grid-cols-3">
        <CardSkeleton />
        <TextSkeleton />
        <FormSkeleton fields={2} />
        <SectionLoader />
        <LoadingOverlay active={busy}><Input label="Inside overlay" /></LoadingOverlay>
        <div className="flex flex-col gap-3"><Spinner label="Loading" /><Progress label="Upload" value={60} showValue /><Progress label="Working" /></div>
      </section>

      <section aria-label="States" className="grid items-start gap-4 md:grid-cols-2">
        <EmptyState title="No projects" description="Create the first one" action={<Button leftIcon={Plus}>New project</Button>} />
        <ErrorState onRetry={() => toast.info('Trying again')} reference="req-123" />
        <Alert variant="success" title="Done">Your file was imported.</Alert>
        <Alert variant="warning" title="Check this" onDismiss={() => undefined}>Two rows were skipped.</Alert>
        <div className="flex items-center gap-2"><Avatar name="Asha Rao" /><Avatar name="Ben" size="sm" /><Badge variant="danger">Overdue</Badge><Badge>Draft</Badge></div>
      </section>

      <Modal open={modal.isOpen} onClose={modal.close} title="Edit person" description="Fields work inside a modal" footer={<><Button variant="outline" onClick={modal.close}>Cancel</Button><Button onClick={() => { modal.close(); toast.success('Saved'); }}>Save</Button></>}>
        <div className="flex flex-col gap-4">
          <Input label="Name" defaultValue="Asha" />
          <Dropdown label="Person role" options={roles} />
          <DatePicker label="Start" />
        </div>
      </Modal>
      <Drawer open={drawer.isOpen} onClose={drawer.close} title="Details">Content</Drawer>
    </PageContainer>
  );
}
