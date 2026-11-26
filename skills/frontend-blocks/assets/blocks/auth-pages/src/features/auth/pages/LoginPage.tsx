import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import { Form, FormActions, FormField } from '@/components/form';
import { Alert } from '@/components/ui/alert';
import { Input, PasswordInput } from '@/components/ui/fields';
import { ROUTES } from '@/config/routes';
import { ApiError } from '@/services/api-error';
import { AuthPage, TextLink } from '../components/AuthPage';
import { useAuth } from '../hooks/auth-context';
import { authText, emailRules } from '../utils/auth-rules';

/** Inside GuestRoute, which opens the page people wanted after signing in. */
export function LoginPage() {
  const { signIn } = useAuth();
  const location = useLocation();
  const state = location.state as { message?: string; email?: string } | null;
  const form = useForm({ defaultValues: { email: state?.email ?? '', password: '' } });

  const submit = async (values: { email: string; password: string }) => {
    try {
      await signIn(values);
    } catch (error) {
      // One message for both cases, so nobody can test which emails exist.
      if (error instanceof ApiError && [400, 401, 404].includes(error.status)) throw new Error(authText.wrongLogin, { cause: error });
      throw error;
    }
  };

  return (
    <AuthPage title="Sign in" footer={<>New here? <TextLink to={ROUTES.register}>Create an account</TextLink></>}>
      {state?.message && <Alert variant="success">{state.message}</Alert>}
      <Form form={form} onSubmit={submit}>
        <FormField control={form.control} name="email" rules={emailRules}
          render={(field) => <Input {...field} type="email" autoComplete="username" label={authText.email} required />} />
        <FormField control={form.control} name="password" rules={{ required: authText.enterPassword }}
          render={(field) => (
            <PasswordInput {...field} autoComplete="current-password" label={authText.password} required
              labelAction={<TextLink to={ROUTES.forgotPassword}>Forgot password?</TextLink>} />
          )} />
        <FormActions submitLabel="Sign in" />
      </Form>
    </AuthPage>
  );
}
