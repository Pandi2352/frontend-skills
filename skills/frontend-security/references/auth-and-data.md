# Auth and data

`frontend-api` already builds the login, the session restore, token refresh,
guarded routes, permissions, the safe return path after login, and sign-out
for all tabs. This page explains the reasons, so you keep them when you change
things, and it covers what that skill does not.

## Where tokens live

| Place | XSS can read it | Sent by itself (CSRF) | Use for |
| --- | --- | --- | --- |
| Memory (a variable) | Only while the page runs | No | Access token |
| `httpOnly`, `Secure`, `SameSite` cookie | No | Yes, so protect against CSRF | Refresh token or session |
| `localStorage` or `sessionStorage` | Yes, at any time | No | Never tokens |
| URL (query or hash) | Leaks to history, logs and `Referer` | | Never tokens. One-time codes only, removed at once |

If the backend can only return tokens in JSON and the user wants them in
storage: say that any XSS can then steal a long-lived login, suggest the cookie
change on the server, and ask before going ahead.

OAuth and OpenID Connect in a single-page app: use the Authorization Code flow
with PKCE, never the implicit flow. Better, use a backend-for-frontend that
keeps the tokens and gives the browser a cookie.

## CSRF, when auth uses cookies

The browser sends cookies with requests from other sites too.

- The cookie is `SameSite=Lax` (or `Strict`), `Secure` and `httpOnly`.
- Every request that changes data (`POST`, `PUT`, `PATCH`, `DELETE`) sends a
  CSRF token header that the server checks. The api client sets it in one place.
- `GET` never changes data. A link such as `/orders/5/delete` must not work.
- CORS is set on the server with an exact list of origins, and never
  `Access-Control-Allow-Origin: *` together with credentials.

## Redirects

Any value from the URL that leads somewhere (`?next=`, `?returnTo=`,
`?redirect=`) is checked:

```ts
function safeReturnPath(value: string | null, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  const url = new URL(value, location.origin);
  return url.origin === location.origin ? url.pathname + url.search + url.hash : fallback;
}
```

The same applies to links in emails and notifications that the app follows by
itself.

## Access control on screen

- Guards, `CanAccess` and hidden menu items are for a clean screen only. Every
  API call must be checked on the server, and a 403 is handled (`frontend-api`).
- Do not send data to the browser that the user may not see, even if the screen
  hides it. It is visible in the network tab.
- IDs in URLs (`/invoices/123`) are fine. The server checks that 123 belongs to
  the user, not the frontend.
- Disabled buttons and read-only fields are not protection. The server checks.

## Storage and caching

- `localStorage` holds only settings: theme, language, sidebar state, table
  columns. No personal data, no tokens, and nothing that would hurt if another
  user on the same computer saw it.
- Cached API data (TanStack Query, persisted caches, IndexedDB, service worker
  caches) is cleared on sign-out. Do not persist the query cache for apps with
  private data unless the user agrees.
- Forms with sensitive data: `autoComplete="off"` only where the browser must not
  keep the value (card security codes, one-time codes use `one-time-code`).
  Passwords keep `current-password` and `new-password`, so password managers
  work.

## Sign-out and sessions

On sign-out:
1. Call the server, so it ends the session and clears the cookie.
2. Clear the memory token, the query cache, stores, and session settings that
   belong to this user.
3. Tell other tabs (`BroadcastChannel` or a `storage` event), so they sign out
   too.
4. Go to the login page with `replace`, so Back does not show private pages.

Idle logout (`frontend-blocks`) warns first and lets the user stay
(accessibility needs that too).

## Logs, errors and analytics

- No tokens, passwords, codes, card numbers, IDs of documents, or personal data
  in `console`, error reports, analytics events or URLs.
- Error trackers (Sentry and others): scrub request bodies, headers
  (`Authorization`, `Cookie`) and query strings before sending. Turn off session
  replay or mask all inputs.
- Error messages on screen do not show stack traces, SQL or server internals.
  Show a short message and a reference ID.
- `console.log` calls are removed or silenced in production builds.

## Personal data (GDPR and similar)

- Ask only for fields the feature needs.
- Analytics and marketing scripts load after consent, where the law requires it.
- Mask sensitive values on screen when they are not needed (`•••• 4242`), and
  offer a reveal button with a reason.
- Exports with personal data say so in the button or the confirm dialog.

## Find it

```text
localStorage   sessionStorage   indexedDB   document.cookie
token   jwt   Bearer   Authorization   password   secret   apiKey   api_key
console.log   console.error   ?redirect   ?next   returnTo   navigate(   window.location
withCredentials   credentials: 'include'   Access-Control-Allow-Origin
```

For each `localStorage` or `sessionStorage` hit: what is stored, and would it hurt
if read by a script or by another person on the same computer?
