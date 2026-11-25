import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, FormActions, FormField } from '@/components/form';
import { Input } from '@/components/ui/fields';
import { ROUTES } from '@/config/routes';
import { AuthPage, TextLink } from '../components/AuthPage';
import { accountService } from '../services/account.service';
import { authText, emailRules } from '../utils/auth-rules';

/** The same answer whether or not the account exists. */
export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState('');
  const form = useForm({ defaultValues: { email: '' } });
  const back = <TextLink to={ROUTES.login}>Back to sign in</TextLink>;

  if (sentTo) {
    return (
      <AuthPage
        title="Check your email"
        description={<span role="status">If there is an account for {sentTo}, we sent a link to set a new password.</span>}
        footer={back}
      />
    );
  }
  return (
    <AuthPage title="Forgot password" description="We will send you a link to set a new one." footer={back}>
      <Form
        form={form}
        onSubmit={async ({ email }) => {
          await accountService.forgotPassword(email);
          setSentTo(email);
        }}
      >
        <FormField control={form.control} name="email" rules={emailRules}
          render={(field) => <Input {...field} type="email" autoComplete="username" label={authText.email} required />} />
        <FormActions submitLabel="Send link" />
      </Form>
    </AuthPage>
  );
}
