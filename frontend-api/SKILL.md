---
name: frontend-api
description: The user's standard way to connect a React + TypeScript frontend to a backend - API client, error handling, login, session restore, token refresh, sign out, protected routes, roles and permissions, server data with TanStack Query, file upload with progress. Use whenever adding or fixing API calls, services, axios/fetch code, authentication, login pages, 401/403 handling, permissions, query or mutation hooks, or server validation errors in a frontend, even if the user only says "connect the API" or "add login". Not for building the backend itself.
---

# Frontend API and auth

Finished, tested code is in `assets/template/src`. Copy it; do not rewrite it.
It needs `frontend-core` (its structure, Button and forms); add that first.

```text
page → feature hook (query/mutation) → feature service → services/api.ts
```

Pages and components never call `fetch`. Only `services/api-client.ts` does.

## Setup

1. Ask only what is missing: API base URL, login/refresh/logout/me endpoints,
   how the session works (below), roles. If there is an OpenAPI file or existing
   backend code, read that instead of asking.
2. `node <skill>/scripts/add-to-project.mjs <project>` copies the code and never
   overwrites a file.
3. Install `@tanstack/react-query` and `react-router` at the newest versions that
   support the installed Node (`resolve-versions.mjs` from frontend-core). Do not
   change Node.
4. Set `VITE_API_URL`. Adjust only `features/auth/services/auth.service.ts` to the
   real endpoints and `config/permissions.ts` to the real roles.
5. Wrap the app: `QueryClientProvider` outside, `AuthProvider` inside, router
   inside that.

## Session

Default: short access token **in memory**, refresh token in an **httpOnly,
Secure, SameSite cookie** set by the server. A reload restores the session with
one refresh call.

- Cookie-only session: `refresh` returns null, requests still send cookies. The
  server must then protect against CSRF.
- If the server only returns tokens in JSON, tell the user that keeping them in
  local storage lets any XSS steal them, and ask before doing it.

Built in: one refresh for many parallel 401s; a network failure during refresh
does not sign the person out; sign out clears cached data and reaches other tabs;
the token is never sent to another host.

## Feature pattern

```ts
// features/users/services/users.service.ts
export const usersService = {
  list: (params: UserListParams, signal?: AbortSignal) =>
    api.get<Paginated<UserDto>>('/users', { query: { ...params }, signal }).then(toUserPage),
  create: (input: UserInput) => api.post<UserDto>('/users', toUserDto(input)).then(toUser),
};

// features/users/hooks/useUsers.ts
export const userKeys = {
  all: ['users'] as const,
  list: (params: UserListParams) => [...userKeys.all, 'list', params] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
};
export const useUsers = (params: UserListParams) =>
  useQuery({
    queryKey: userKeys.list(params),
    queryFn: ({ signal }) => usersService.list(params, signal),
    placeholderData: keepPreviousData,
  });
export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: usersService.create,
    onSuccess: () => client.invalidateQueries({ queryKey: userKeys.all }),
  });
}
```

In a form: `onSubmit={(values) => createUser.mutateAsync(values)}`. `Form` puts
`ApiError.fieldErrors` below the matching fields and the rest on top.

## Rules

- DTO types match the server; mappers turn them into UI types. The UI never
  depends on server field names.
- Pass `signal` in every query. Retries are for reads only; never retry a
  mutation automatically unless it has an idempotency key.
- Server data stays in the query cache; do not copy it into state.
- List filters, sort and page live in the URL and in the query key.
- Every screen handles loading, empty, error with retry, 403 and 404.
- Show `getErrorMessage(error)`. Never show stack traces or raw bodies.
- Optimistic updates need rollback. Disable repeat actions while pending.
- Hiding a button is not security. The server checks every request.
- No secrets in `VITE_` variables. No tokens or personal data in logs or URLs.

| Status | Behaviour |
| --- | --- |
| 400, 422 | field errors below fields, rest at the top of the form |
| 401 | refresh once, then sign out |
| 403 | forbidden state, no retry |
| 404 | not-found state |
| 409 | explain the conflict, offer reload |
| 429 | ask to wait, use Retry-After |
| 5xx, network, timeout | friendly message, retry button, request id if present |

Details and examples: `references/auth.md` (login page, routes, permissions,
upload). Read it only for that work.

Finish with `lint`, `typecheck`, `test`, `build` and report real results.
