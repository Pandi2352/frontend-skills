import { useForm } from 'react-hook-form';
import { Form, FormActions, FormField, FormSection } from '@/components/form';
import { PageContainer, PageHeader } from '@/components/layout/page';
import { AsyncView } from '@/components/shared/states';
import { UnsavedChangesGuard } from '@/components/shared/unsaved-changes';
import { Card } from '@/components/ui/card';
import { ImageUpload, Input, PhoneInput, phoneRule } from '@/components/ui/fields';
import { FormSkeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/services/api-error';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import type { Profile } from '../services/profile.service';

function ProfileForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const form = useForm<{ avatar: File | string | null; name: string; phone: string }>({
    defaultValues: { avatar: profile.avatarUrl, name: profile.name, phone: profile.phone },
  });
  return (
    <Form
      form={form}
      onSubmit={async (values) => {
        const { avatar } = values;
        const removed = avatar === null && form.formState.defaultValues?.avatar !== null;
        const user = await update.mutateAsync({ ...values, avatar: avatar instanceof File ? avatar : removed ? 'remove' : 'keep' });
        form.reset({ ...values, avatar: avatar instanceof File ? (user.avatarUrl ?? null) : avatar });
        toast.success('Profile saved');
      }}
    >
      <UnsavedChangesGuard />
      <FormSection columns={2}>
        <FormField control={form.control} name="avatar"
          render={(field) => <ImageUpload {...field} label="Picture" shape="circle" maxSize={2 * 1024 * 1024} className="md:col-span-2" />} />
        <FormField control={form.control} name="name" rules={{ required: 'Enter your name' }}
          render={(field) => <Input {...field} label="Full name" autoComplete="name" required />} />
        <Input label="Email" value={profile.email} readOnly helperText="Ask support to change it." />
        <FormField control={form.control} name="phone" rules={{ validate: phoneRule() }}
          render={(field) => <PhoneInput {...field} label="Phone" clearable />} />
      </FormSection>
      <FormActions submitLabel="Save changes" requireChanges />
    </Form>
  );
}

export function ProfilePage() {
  const profile = useProfile();
  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Profile" />
      <Card>
        <AsyncView
          data={profile.data}
          isLoading={profile.isPending}
          error={profile.error && getErrorMessage(profile.error)}
          onRetry={() => void profile.refetch()}
          loader={<FormSkeleton />}
        >
          {(data) => <ProfileForm profile={data} />}
        </AsyncView>
      </Card>
    </PageContainer>
  );
}
