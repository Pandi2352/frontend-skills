import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { Form, FormActions, FormField } from '@/components/form';
import { PasswordInput } from '@/components/ui/fields';
import { ROUTES } from '@/config/routes';
import { AuthPage, TextLink } from '../components/AuthPage';
import { accountService } from '../services/account.service';
import { authText, newPasswordRules, repeatRules } from '../utils/auth-rules';

/** Opened from the email: /reset-password?token=… */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [token] = useState(() => params.get('token') ?? '');
  const form = useForm({ defaultValues: { password: '', repeat: '' } });

  // The token must not stay in the address bar, the history or a screenshot.
  const inAddress = params.has('token');
  useEffect(() => {
    if (inAddress) setParams({}, { replace: true });
  }, [inAddress, setParams]);

  if (!token) {
    return (
      <AuthPage title="This link does not work" description="It may be old or already used."
        footer={<TextLink to={ROUTES.forgotPassword}>Get a new link</TextLink>} />
    );
  }
  return (
    <AuthPage title="Set a new password">
      <Form
        form={form}
        onSubmit={async ({ password }) => {
          await accountService.resetPassword(token, password);
          await navigate(ROUTES.login, { replace: true, state: { message: 'Your password was changed. Sign in to continue.' } });
        }}
      >
        <FormField control={form.control} name="password" rules={newPasswordRules}
          render={(field) => <PasswordInput {...field} autoComplete="new-password" label={authText.newPassword} required showStrength helperText={authText.shortPassword} />} />
        <FormField control={form.control} name="repeat" rules={repeatRules}
          render={(field) => <PasswordInput {...field} autoComplete="new-password" label={authText.repeatPassword} required />} />
        <FormActions submitLabel="Save password" />
      </Form>
    </AuthPage>
  );
}
