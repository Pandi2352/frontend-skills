# Auth, routes, permissions, upload

## Providers

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
</QueryClientProvider>
```

`useAuth()` returns `{ status, user, signIn, signOut }`. Status is `loading` until
the session restore ends, so guards never flash the login page.

## Routes

```tsx
{ element: <GuestRoute />, children: [{ path: '/login', element: <LoginPage /> }] },
{ element: <ProtectedRoute />, children: [
  { path: '/', element: <DashboardPage /> },
  { element: <PermissionRoute permission="users.read" />, children: usersRoutes },
] }
```

After login people return to the page they asked for. Only internal paths are
accepted, so a crafted link cannot redirect to another site.

## Login page

```tsx
const form = useForm({ defaultValues: { email: '', password: '' } });
<Form form={form} onSubmit={signIn}>
  <FormField control={form.control} name="email" rules={{ required: 'Enter your email' }}
    render={(field) => <Input {...field} type="email" label="Email" required autoComplete="username" />} />
  <FormField control={form.control} name="password" rules={{ required: 'Enter your password' }}
    render={(field) => <PasswordInput {...field} label="Password" required />} />
  <FormActions submitLabel="Sign in" />
</Form>
```

- Wrong login: one message for both cases ("Email or password is incorrect").
- Forgot password: same reply whether or not the account exists.
- Finished pages (login, register, code, forgot, reset, change password, profile,
  settings) and idle sign out: `frontend-blocks`.

## Permissions

`config/permissions.ts` lists permissions and what each role has. Use
`<CanAccess permission="users.delete">` or `usePermission()`. If the server sends
permissions with the user, use those and delete the role map.

## Upload

```tsx
<FileUpload label="Documents" multiple
  upload={(file, options) => uploadFile('/files', file, options)} />
```

`uploadFile` reports progress, can be cancelled, and refreshes the session first
if needed.
