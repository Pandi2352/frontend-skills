import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { session } from '@/services/session';
import { AuthContext, type Auth } from '../hooks/auth-context';
import { authService } from '../services/auth.service';

type State = Pick<Auth, 'status' | 'user'>;
const signedOut: State = { status: 'signedOut', user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const [state, setState] = useState<State>({ status: 'loading', user: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let stale = false;
    authService.restore().then(
      (user) => {
        if (!stale) setState(user ? { status: 'signedIn', user } : signedOut);
      },
      () => {
        if (!stale) setState({ status: 'error', user: null });
      },
    );
    return () => {
      stale = true;
    };
  }, [attempt]);

  useEffect(
    () =>
      session.onEnd(() => {
        // The next person must not see cached data.
        client.clear();
        setState(signedOut);
      }),
    [client],
  );

  const auth = useMemo<Auth>(
    () => ({
      ...state,
      signIn: async (credentials) => {
        client.clear();
        setState({ status: 'signedIn', user: await authService.signIn(credentials) });
      },
      signOut: async () => {
        try {
          await authService.signOut();
        } finally {
          // Signed out on this device even if the server did not answer.
          session.end();
        }
      },
      updateUser: (changes) =>
        setState((s) => (s.user ? { ...s, user: { ...s.user, ...changes } } : s)),
      retry: () => {
        setState({ status: 'loading', user: null });
        setAttempt((n) => n + 1);
      },
    }),
    [state, client],
  );
  return <AuthContext value={auth}>{children}</AuthContext>;
}
