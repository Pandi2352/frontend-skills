import { useForm } from 'react-hook-form';
import { Form, FormActions, FormField } from '@/components/form';
import { PasswordInput } from '@/components/ui/fields';
import { toast } from '@/components/ui/toast';
import { accountService } from '../services/account.service';
import { authText, newPasswordRules, repeatRules } from '../utils/auth-rules';

/** For the settings page. */
export function ChangePasswordForm() {
  const form = useForm({ defaultValues: { current: '', password: '', repeat: '' } });
  return (
    <Form
      form={form}
      className="max-w-md"
      onSubmit={async ({ current, password }) => {
        await accountService.changePassword(current, password);
        form.reset();
        toast.success('Password changed');
      }}
    >
      <FormField control={form.control} name="current" rules={{ required: authText.enterPassword }}
        render={(field) => <PasswordInput {...field} autoComplete="current-password" label={authText.currentPassword} required />} />
      <FormField control={form.control} name="password" rules={newPasswordRules}
        render={(field) => <PasswordInput {...field} autoComplete="new-password" label={authText.newPassword} required showStrength helperText={authText.shortPassword} />} />
      <FormField control={form.control} name="repeat" rules={repeatRules}
        render={(field) => <PasswordInput {...field} autoComplete="new-password" label={authText.repeatPassword} required />} />
      <FormActions submitLabel="Change password" />
    </Form>
  );
}
