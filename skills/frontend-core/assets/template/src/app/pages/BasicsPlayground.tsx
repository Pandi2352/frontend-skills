import { CreditCard, Package, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { useConfirm } from '@/components/shared/confirm';
import { EmptyState, ErrorState } from '@/components/shared/states';
import { Accordion } from '@/components/ui/accordion';
import { Alert } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, StatCard } from '@/components/ui/card';
import { CopyButton } from '@/components/ui/copy-button';
import { KeyValueList } from '@/components/ui/key-value-list';
import { LoadingOverlay, Progress, SectionLoader, Spinner, TopProgressBar } from '@/components/ui/loader';
import { Drawer, Modal } from '@/components/ui/modal';
import { CardSkeleton, FormSkeleton, TextSkeleton } from '@/components/ui/skeleton';
import { Stepper } from '@/components/ui/stepper';
import { Tabs } from '@/components/ui/tabs';
import { Timeline } from '@/components/ui/timeline';
import { toast } from '@/components/ui/toast';
import { Tooltip } from '@/components/ui/tooltip';
import { useDisclosure } from '@/hooks/useDisclosure';
import { useStepper } from '@/hooks/useStepper';
import { useUrlState } from '@/hooks/useUrlState';

// The common components. Routed in development only.

const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

export function BasicsPlayground() {
  const confirm = useConfirm();
  const modal = useDisclosure();
  const drawer = useDisclosure();
  const steps = useStepper(3);
  const [tab, setTab] = useUrlState<string>('tab', 'overview');
  const [busy, setBusy] = useState(false);

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
        description="The common components"
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
        <CopyButton text="Copied text" variant="outline" />
        <Button variant="danger" leftIcon={Trash2} onClick={() => void remove('Project')}>Confirm</Button>
        <Tooltip text="Extra help"><Button variant="ghost">Tooltip</Button></Tooltip>
        <Button variant="outline" isLoading={busy} onClick={() => { setBusy(true); void wait(1500).then(() => setBusy(false)); }}>Load</Button>
      </section>

      <section aria-label="Numbers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Customers" value="1,240" icon={Users} change={0.124} changeNote="than last month" />
        <StatCard label="Returns" value="18" icon={Package} change={-0.08} changeNote="than last month" lowerIsBetter />
        <StatCard label="Revenue" value="$48,200" icon={CreditCard} change={-0.021} changeNote="than last month" />
        <StatCard label="Loading" value="" isLoading />
      </section>

      <Tabs
        label="Order"
        value={tab}
        onChange={setTab}
        items={[
          {
            id: 'overview', label: 'Overview', icon: Package,
            content: (
              <Card title="Order 1042" description="Placed today" actions={<Badge variant="success">Paid</Badge>} footer={<Button>Ship</Button>}>
                <KeyValueList items={[{ label: 'Number', value: 'ORD-1042', copy: 'ORD-1042' }, { label: 'Customer', value: 'Asha Rao' }, { label: 'Note', value: '' }]} />
              </Card>
            ),
          },
          {
            id: 'history', label: 'History', badge: <Badge size="sm">3</Badge>,
            content: (
              <Timeline
                label="History"
                items={[
                  { id: '1', title: 'Paid', time: '10:30', tone: 'success', icon: CreditCard, description: 'Card ending 4242' },
                  { id: '2', title: 'Packed', time: '11:05', icon: Package },
                  { id: '3', title: 'Waiting for pickup' },
                ]}
              />
            ),
          },
          { id: 'locked', label: 'Locked', disabled: true, content: null },
        ]}
      />

      <Card title="Stepper" footer={<><Button variant="outline" disabled={steps.isFirst} onClick={steps.back}>Back</Button><Button disabled={steps.isLast} onClick={() => void steps.next()}>Next</Button></>}>
        <Stepper
          label="Checkout"
          current={steps.current}
          reached={steps.reached}
          onStepClick={steps.goTo}
          steps={[{ id: 'a', label: 'Cart' }, { id: 'b', label: 'Address', description: 'Where to send it' }, { id: 'c', label: 'Payment' }]}
        />
      </Card>

      <Accordion
        items={[
          { id: 'a', title: 'How long does delivery take?', content: 'Two to four days.' },
          { id: 'b', title: 'Can I return it?', extra: <Badge>New</Badge>, content: 'Within 30 days.' },
          { id: 'c', title: 'Not available', disabled: true, content: null },
        ]}
      />

      <section aria-label="Loaders" className="grid items-start gap-4 md:grid-cols-3">
        <CardSkeleton />
        <TextSkeleton />
        <FormSkeleton fields={2} />
        <SectionLoader />
        <LoadingOverlay active={busy}><Card title="Inside overlay">Content</Card></LoadingOverlay>
        <div className="flex flex-col gap-3"><Spinner label="Loading" /><Progress label="Upload" value={60} showValue /><Progress label="Working" /></div>
      </section>

      <section aria-label="States" className="grid items-start gap-4 md:grid-cols-2">
        <EmptyState title="No projects" description="Create the first one" action={<Button leftIcon={Plus}>New project</Button>} />
        <ErrorState onRetry={() => toast.info('Trying again')} reference="req-123" />
        <Alert variant="success" title="Done">Your file was imported.</Alert>
        <Alert variant="warning" title="Check this" onDismiss={() => undefined}>Two rows were skipped.</Alert>
        <div className="flex items-center gap-2"><Avatar name="Asha Rao" /><Avatar name="Ben" size="sm" /><Badge variant="danger">Overdue</Badge><Badge>Draft</Badge></div>
      </section>

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title="Edit person"
        description="Closes with Escape, the button or a click outside"
        footer={<><Button variant="outline" onClick={modal.close}>Cancel</Button><Button onClick={() => { modal.close(); toast.success('Saved'); }}>Save</Button></>}
      >
        Content
      </Modal>
      <Drawer open={drawer.isOpen} onClose={drawer.close} title="Details">Content</Drawer>
    </PageContainer>
  );
}
