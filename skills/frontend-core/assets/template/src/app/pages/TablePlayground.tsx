import { Package, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { CommandMenu } from '@/components/shared/command-menu';
import { DataTable, FilterBar, useTableState, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker, Dropdown, Input } from '@/components/ui/fields';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/components/ui/toast';
import { useDisclosure } from '@/hooks/useDisclosure';

// Table, filters, command menu, and fields inside a dialog. Routed in development only.

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

const roles = ['Admin', 'Editor', 'Viewer'].map((r) => ({ value: r, label: r }));

export function TablePlayground() {
  const modal = useDisclosure();
  const commands = useDisclosure();
  const [state, setState] = useTableState();
  const [role, setRole] = useState<string | null>(null);
  const rows = role ? people.filter((p) => p.role === role) : people;

  return (
    <PageContainer>
      <PageHeader title="Table" actions={<Button variant="outline" onClick={commands.open}>Open commands</Button>} />

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
          { label: 'Delete', icon: Trash2, danger: true, onSelect: () => toast.info(`Delete ${p.name}`) },
        ]}
        renderDetails={(p) => `Contact: ${p.email}`}
      />

      <CommandMenu
        open={commands.isOpen}
        onClose={commands.close}
        recentKey="playground-commands"
        commands={[
          { id: 'users', label: 'Users', group: 'Go to', icon: Users, onSelect: () => toast.info('Users') },
          { id: 'orders', label: 'Orders', group: 'Go to', icon: Package, onSelect: () => toast.info('Orders') },
          { id: 'new', label: 'New user', group: 'Create', keywords: 'add', icon: Plus, shortcut: 'N', onSelect: () => toast.info('New user') },
        ]}
      />

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title="Edit person"
        description="Fields work inside a modal"
        footer={<><Button variant="outline" onClick={modal.close}>Cancel</Button><Button onClick={() => { modal.close(); toast.success('Saved'); }}>Save</Button></>}
      >
        <div className="flex flex-col gap-4">
          <Input label="Name" defaultValue="Asha" />
          <Dropdown label="Person role" options={roles} />
          <DatePicker label="Start" />
        </div>
      </Modal>
    </PageContainer>
  );
}
