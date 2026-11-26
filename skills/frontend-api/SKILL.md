---
name: frontend-api
description: Connects a React + TypeScript frontend to a backend with finished code - API client, errors, login, token refresh, guarded routes, permissions, TanStack Query, upload. Use for API calls, services, auth, 401/403, query or mutation hooks, server validation errors. Not for building the backend.
---

# Frontend API and auth

Finished code; do not open or retype `assets/`. Projects made with `create.mjs` already
have it. Otherwise: `node <skill>/scripts/add-to-project.mjs <project>` (after
frontend-core), then `@tanstack/react-query` with `resolve-versions.mjs`.

```text
page → feature hook → feature service → services/api.ts
```

Only `services/api-client.ts` calls `fetch`. Write features with
`node scripts/generate.mjs feature …`; it makes service, hooks, pages and tests.

## Connect

1. OpenAPI file or backend code in reach: read that. Otherwise ask for base URL,
   login/refresh/logout/me endpoints, session type, roles. Do not invent them.
   No backend yet: build sample data for this project as `references/mock-data.md` says.
   No backend yet: build sample data for this project as  says.
2. Set `VITE_API_URL`. Adapt `features/auth/services/auth.service.ts` and each
   `*.service.ts`; different names are translated there and nowhere else.
3. Real roles in `config/permissions.ts`.
4. Providers: `QueryClientProvider` > `AuthProvider` > router.

## Session

Access token in memory, refresh token in an httpOnly, Secure, SameSite cookie.
Cookie-only: `refresh` returns null, and the server protects against CSRF. Tokens only
in JSON: say that local storage lets any XSS steal them, and ask first.

Built in: one refresh for many 401s, network failure does not sign out, sign out clears
the cache and reaches other tabs, token never goes to another host.

## Rules

- `signal` in every query. No automatic retry of mutations.
- Server data stays in the query cache. Filters, sort and page in URL and key.
- `getErrorMessage(error)`, never raw bodies. `ApiError.fieldErrors` reach the fields
  through `Form`.
- Optimistic changes undo on failure.
- Hiding a button is not security. No secrets in `VITE_`, no tokens in logs or URLs.

| Status | Behaviour |
| --- | --- |
| 400, 422 | below fields, rest on top of the form |
| 401 | refresh once, then sign out |
| 403, 404 | own state, no retry |
| 409 | explain, offer reload |
| 429 | wait, Retry-After |
| 5xx, network | message, retry, request id |

Login page, guards, permissions, upload by hand: `references/auth.md`.
