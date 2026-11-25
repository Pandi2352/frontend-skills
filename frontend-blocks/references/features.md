# Pages and app features

## Auth pages

```tsx
{ element: <AuthLayout logo={<Logo />} />, children: [
  { element: <GuestRoute />, children: [
    { path: ROUTES.login, lazy: async () => ({ Component: (await import('@/features/auth/pages/LoginPage')).LoginPage }) },
    // RegisterPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage the same way
  ] },
] }
```

Check in `services/account.service.ts`: paths, and whether register returns
`verificationRequired`. Built in: one message for wrong email or password, the same
answer for unknown emails, the reset token leaves the address bar, a pause before
sending a new code. The server must limit attempts.

## Profile and settings

`ProfilePage` saves with a form and updates the name in the navbar (`updateUser` in
`frontend-api`). `SettingsPage` saves at once and undoes on failure; its tab is in the
address. Remove tabs the project does not need.

## Dark mode

`styles/index.css`: `@import './dark.css';` after `theme.css`. `App`: `useApplyTheme()`.
Navbar: `<ThemeMenu />`. In the head of `index.html`, so it never flashes:

```html
<script>
  try {
    var t = localStorage.getItem('theme');
    var dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  } catch (e) { /* stays light */ }
</script>
```

With a strict Content-Security-Policy put it in a file or allow its hash. Change
tokens only; never `dark:` classes. Logos and images need a version that works on
both. Check contrast when you change a color.

## Languages

```tsx
// main.tsx
await startI18n();
createRoot(root).render(<App />);

t('users.welcome', { name })        // keys are checked by TypeScript
t('users.count', { count: 3 })      // plural forms of the language
```

- A new language: one line in `lib/i18n.ts`, one file in `src/locales`, and the words
  of shared components (`ui`, `fields`). Missing ones stay English.
- Whole sentences with `{values}`, never pieces put together.
- Texts outside components (constants, columns) are read once, after `startI18n`.
  That works, because changing the language reloads the page. `main.tsx` must load
  the app with `import()` after `startI18n` if constants call `t` at module level.
- Right to left: `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`. Arrows
  turn by themselves. Test with `<html dir="rtl">`.
- Never translate with a machine without telling the user.

## Unsaved changes and autosave

`<UnsavedChangesGuard />` inside `Form`; `form.reset(values)` after saving and before
navigating. `Modal`: use `beforeClose`. Do not use both blocks in one form.

```tsx
const values = useWatch({ control: form.control }) as Note;
const { isValid } = useFormState({ control: form.control });
const { state, savedAt, saveNow } = useAutosave({ value: values, save: (v, signal) => notes.save(id, v, signal), enabled: isValid });
<AutosaveStatus state={state} savedAt={savedAt} onRetry={saveNow} />
```

Use `key={id}` so another record starts fresh.
Two people editing: the server must detect it (version or ETag) and answer 409.

## Notifications

`<NotificationBell />` in the navbar, `NotificationsPage` in the router. Links are
opened only inside the app. With `realtime`:
`useRealtimeInvalidate('notification', notificationKeys.all)` and remove the interval.

## Realtime

```tsx
export const realtime = createRealtime({ getUrl: async () => `${env.wsUrl}?ticket=${(await api.post<{ ticket: string }>('/realtime/ticket')).ticket}` });

function SignedIn() {
  useRealtimeConnection(realtime);
  return <RealtimeContext value={realtime}><AppLayout … /></RealtimeContext>;
}
useRealtimeInvalidate('order.changed', orderKeys.all);
```

The ticket is short-lived and works once; addresses end up in logs. Messages say what
changed; the data comes through the normal API with its permissions. Servers with
server-sent events: keep the same functions and replace the socket.

## Idle logout

`<IdleLogout minutes={15} onLogout={signOut} />` only for signed-in people. The server
must end the session by itself too.
