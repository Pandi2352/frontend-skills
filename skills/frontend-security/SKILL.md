---
name: frontend-security
description: Keeps React + Vite frontends safe - XSS, unsafe HTML and URLs, token and cookie handling, CSRF, open redirects, secrets in env, CSP and security headers, uploads, iframes and postMessage, third-party scripts, supply chain risks. Use when writing auth, rendering user content, adding packages or hosting, or to audit a frontend.
---

# Frontend security

The browser is not a safe place. Everything in the bundle can be read and
changed by the user. **The server must check every permission and every input
again.** The frontend's job is to avoid running attacker code, avoid leaking
data, and avoid tricking the user.

This skill has no code. It says what to do and how to check it. Login, tokens
and refresh are built by `frontend-api`. Follow its choices and do not rebuild
them.

## Rules when writing any code

Rendering
- React escapes text. Keep it that way: no `dangerouslySetInnerHTML`, `innerHTML`,
  `outerHTML`, `insertAdjacentHTML` or `document.write` with outside data. If
  HTML must be shown (rich text, markdown, email), sanitize it with DOMPurify
  just before rendering.
- URLs from outside (links, images, redirects, `window.open`) are allowed only
  for `https:`, `http:`, `mailto:`, `tel:` or a relative path. Never
  `javascript:` or `data:` in links.
- No `eval`, `new Function`, or `setTimeout` with a string.
- Never build a selector, regex, CSS or style value from user text without
  escaping.

Auth and data
- Tokens: access token in memory, refresh token in an `httpOnly`, `Secure`,
  `SameSite` cookie (`frontend-api`). Do not put tokens in `localStorage`,
  `sessionStorage`, URLs or logs.
- Cookie auth needs CSRF protection: `SameSite=Lax` or `Strict`, plus a CSRF
  header that the server checks for every change. `GET` never changes data.
- Hiding a button is not access control. The server must refuse the request.
- A redirect after login goes only to a path on this site (`/orders`). Never to
  `//evil.com`, `/\evil.com` or a full URL from the query string.
- On sign-out, clear the query cache, stores and storage, and tell other tabs.
- No personal data or tokens in `console`, error trackers, analytics or URLs.

Secrets and build
- Every `VITE_` variable ends up in the bundle and is public. API keys with
  cost or power stay on the server, behind a proxy endpoint.
- Commit `.env.example` only. `.env.local` and `.env.*.local` are in
  `.gitignore`.
- Production builds have no source maps on the public server. Use `hidden`
  maps that are uploaded only to the error tracker.
- Dev-only tools, mocks and debug panels are left out of the production build
  (`import.meta.env.DEV`).

Packages
- Before adding a package, check it is real and alive: the exact name on npm, the
  repository link, downloads, last release, and maintainers. AI tools invent
  names, and attackers register them.
- Commit the lockfile, use `npm ci` in CI, and run `npm audit` in CI.
- No `<script src>` from a CDN without `integrity` (SRI). Prefer npm packages.

Browser features
- External links that open new tabs use `rel="noopener noreferrer"`.
- `postMessage`: check `event.origin` against an exact allow list, and send with
  an exact `targetOrigin`, never `*`.
- `iframe` for outside content uses `sandbox` with only what it needs.
- Uploads: checking type and size in the browser is only for UX. Show uploaded
  SVG and HTML only through `<img>` or as downloads, never inline.

## Read only what the task needs

| Task | Read |
| --- | --- |
| Rendering HTML or markdown, URLs, files, iframes, postMessage, third-party scripts | `references/xss-and-content.md` |
| Login, tokens, cookies, CSRF, redirects, storage, logout, logging, personal data | `references/auth-and-data.md` |
| CSP and headers, hosting, Vite build, env, source maps, packages, CI | `references/headers-and-build.md` |

## Auditing a frontend

1. Search the code for the risky patterns in the "Find it" lists of each
   reference. Read every hit. A hit is not always a bug.
2. Build it, then search `dist/` for secrets and source maps
   (`references/headers-and-build.md`).
3. Run `npm audit --omit=dev`. Look at High and Critical first. Upgrade within
   the Node version, and never change Node.
4. Check the response headers of the hosted site, if a URL is given.
5. If `frontend-review` is installed, run its scan as well.

Report a table of problem, where, how it could be abused, severity, and fix.
High means data or account theft, or running attacker code. Fix High first. Say
what was not checked: the backend, the hosting configuration, and anything the
user did not give access to. Never call a project "secure": say which checks
passed.
