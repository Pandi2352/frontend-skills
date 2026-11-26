import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Form, FormActions, FormField } from '@/components/form';
import { Button } from '@/components/ui/button';
import { OtpInput } from '@/components/ui/fields';
import { toast } from '@/components/ui/toast';
import { ROUTES } from '@/config/routes';
import { getErrorMessage } from '@/services/api-error';
import { AuthPage } from '../components/AuthPage';
import { accountService } from '../services/account.service';

const WAIT = 60;
const LENGTH = 6;

/** A code from the email. Opened by RegisterPage with the address. */
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const form = useForm({ defaultValues: { code: '' } });
  const [wait, setWait] = useState(WAIT);
  const [sending, setSending] = useState(false);

  const waiting = wait > 0;
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(() => setWait((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [waiting]);

  // After a reload the address is unknown.
  if (!email) return <Navigate to={ROUTES.login} replace />;

  const resend = async () => {
    setSending(true);
    try {
      await accountService.resendCode(email);
      setWait(WAIT);
      toast.success('We sent a new code');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthPage title="Check your email" description={`Enter the ${LENGTH}-digit code we sent to ${email}.`}>
      <Form
        form={form}
        onSubmit={async ({ code }) => {
          await accountService.verifyEmail(email, code);
          await navigate(ROUTES.login, { replace: true, state: { email, message: 'Your email is confirmed. Sign in to continue.' } });
        }}
      >
        <FormField control={form.control} name="code"
          rules={{ required: 'Enter the code', minLength: { value: LENGTH, message: `Enter all ${LENGTH} digits` } }}
          render={(field) => <OtpInput {...field} label="Code" length={LENGTH} required />} />
        <FormActions submitLabel="Confirm" />
      </Form>
      <Button variant="link" isLoading={sending} disabled={waiting} onClick={() => void resend()}>
        {waiting ? `Send a new code in ${wait} s` : 'Send a new code'}
      </Button>
    </AuthPage>
  );
}
