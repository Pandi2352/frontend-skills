import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { createMemoryRouter, Link, RouterProvider, useNavigate } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { Form, FormActions, FormField } from '@/components/form';
import { ConfirmProvider } from '@/components/shared/confirm';
import { Input } from '@/components/ui/fields';
import { UnsavedChangesGuard } from './index';

vi.setConfig({ testTimeout: 30_000 });

function Page() {
  const form = useForm({ defaultValues: { name: '' } });
  const navigate = useNavigate();
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        form.reset(values);
        await navigate('/other');
      }}
    >
      <UnsavedChangesGuard />
      <FormField control={form.control} name="name" render={(f) => <Input {...f} label="Name" />} />
      <FormActions submitLabel="Save" />
      <Link to="/other">Away</Link>
    </Form>
  );
}
const show = () =>
  render(
    <ConfirmProvider>
      <RouterProvider router={createMemoryRouter([{ path: '/', element: <Page /> }, { path: '/other', element: <h1>Other</h1> }])} />
    </ConfirmProvider>,
  );

it('asks only with changes; stays or leaves as chosen', async () => {
  const user = userEvent.setup();
  show();
  await user.type(screen.getByLabelText('Name'), 'Asha');
  await user.click(screen.getByRole('link', { name: 'Away' }));
  await user.click(await screen.findByRole('button', { name: 'Keep editing' }));
  expect(screen.getByLabelText('Name')).toHaveValue('Asha');
  await user.click(screen.getByRole('link', { name: 'Away' }));
  await user.click(await screen.findByRole('button', { name: 'Leave' }));
  expect(await screen.findByRole('heading', { name: 'Other' })).toBeVisible();
});

it('does not ask without changes or after saving', async () => {
  const user = userEvent.setup();
  const { unmount } = show();
  await user.click(screen.getByRole('link', { name: 'Away' }));
  expect(await screen.findByRole('heading', { name: 'Other' })).toBeVisible();
  unmount();
  show();
  await user.type(screen.getByLabelText('Name'), 'Asha');
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(await screen.findByRole('heading', { name: 'Other' })).toBeVisible();
});
