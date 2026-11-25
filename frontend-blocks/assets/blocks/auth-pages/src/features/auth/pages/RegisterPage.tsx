import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Form, FormActions, FormField } from '@/components/form';
import { Checkbox, Input, PasswordInput } from '@/components/ui/fields';
import { ROUTES } from '@/config/routes';
import { AuthPage, TextLink } from '../components/AuthPage';
import { accountService } from '../services/account.service';
import { authText, emailRules, newPasswordRules } from '../utils/auth-rules';

export function RegisterPage() {
  const navigate = useNavigate();
  const form = useForm({ defaultValues: { name: '', email: '', password: '', terms: false } });

  return (
    <AuthPage title="Create an account" footer={<>Already have an account? <TextLink to={ROUTES.login}>Sign in</TextLink></>}>
      <Form
        form={form}
        onSubmit={async ({ name, email, password }) => {
          const { verificationRequired } = await accountService.register({ name, email, password });
          await navigate(verificationRequired ? ROUTES.verifyEmail : ROUTES.login, {
            state: verificationRequired ? { email } : { email, message: 'Your account is ready. Sign in to continue.' },
          });
        }}
      >
        <FormField control={form.control} name="name" rules={{ required: 'Enter your name' }}
          render={(field) => <Input {...field} autoComplete="name" label="Full name" required />} />
        <FormField control={form.control} name="email" rules={emailRules}
          render={(field) => <Input {...field} type="email" autoComplete="username" label={authText.email} required />} />
        <FormField control={form.control} name="password" rules={newPasswordRules}
          render={(field) => <PasswordInput {...field} autoComplete="new-password" label={authText.password} required showStrength helperText={authText.shortPassword} />} />
        <FormField control={form.control} name="terms" rules={{ validate: (v) => v || 'Accept the terms to continue' }}
          render={(field) => <Checkbox {...field} label="I accept the terms and the privacy policy" required />} />
        <FormActions submitLabel="Create account" />
      </Form>
    </AuthPage>
  );
}
