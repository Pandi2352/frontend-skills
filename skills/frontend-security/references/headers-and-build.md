# Headers, build, packages

## Security headers

The hosting sends these, not the app. Write them in the hosting file the project
uses (`vercel.json`, `netlify.toml` `_headers`, nginx, Cloudflare, S3 and
CloudFront). If `frontend-performance` is installed, its hosting files are the
place to add them.

| Header | Value to start with | Stops |
| --- | --- | --- |
| `Content-Security-Policy` | see below | Injected scripts, data sent to strange hosts |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (add `preload` only when every subdomain is HTTPS) | Downgrade to HTTP |
| `X-Content-Type-Options` | `nosniff` | Files run as another type |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Paths and IDs leaking to other sites |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()`, allowing only what the app uses | Misuse of device features |
| `Cross-Origin-Opener-Policy` | `same-origin` (`same-origin-allow-popups` if OAuth or payment popups are used) | Other windows reaching this one |
| `X-Frame-Options` | `DENY`, for old browsers, together with `frame-ancestors` | Clickjacking |

Caching: `index.html` with `Cache-Control: no-cache`. Hashed files in
`/assets/` with `public, max-age=31536000, immutable`. API responses with
private data: `no-store` (server side).

## Content Security Policy

A Vite production build puts scripts in files and no inline scripts in
`index.html`, so a strict policy works without nonces:

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://cdn.example.com;
font-src 'self';
connect-src 'self' https://api.example.com wss://api.example.com;
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests
```

- Fill `connect-src`, `img-src` and others from the project: the API host,
  the error tracker, analytics, maps, fonts. Read `.env.example` and the
  services to find them. Do not guess hosts.
- `style-src 'unsafe-inline'` is often needed by libraries that inject `<style>`
  tags. Try without it first. `style={}` props in React do not need it.
- Start with `Content-Security-Policy-Report-Only` and a report endpoint, use
  the app for a few days, then switch to the enforcing header.
- The dev server needs looser rules (hot reload uses inline code and
  WebSockets). Apply the policy only in production hosting, not in
  `index.html`.
- Never add `'unsafe-eval'`. If a library needs it, look for another library or
  tell the user.
- Server-rendered or nonce-based setups: Vite has `html.cspNonce` for a nonce
  placeholder that the server fills on each request.
- Advanced, when the user wants it: `require-trusted-types-for 'script'` blocks
  all string-to-HTML sinks. It needs a policy for DOMPurify and is worth it for
  apps with a lot of user content.

## Vite build and env

- Only variables starting with `VITE_` reach the code, and they are public.
  Treat them like text in the HTML.
- Validate env at startup (`frontend-api` adds `config/env.ts` for this). A missing API
  host fails early, not on the first request.
- `build.sourcemap`: `false`, or `'hidden'` plus upload to the error tracker and
  delete the `.map` files before deploying.
- Never expose the dev server (`vite --host`, `server.host: true`) on a public or
  shared network. It serves the source code. Keep Vite up to date, because dev
  server bugs are fixed often.
- `vite preview` is not a production server.

After `npm run build`, check `dist/`:

```bash
grep -rEl "sk_live|sk-[A-Za-z0-9]{20}|AKIA[0-9A-Z]{16}|-----BEGIN|password=|secret" dist/
find dist -name "*.map"
```

Read each hit. Public keys that are meant to be public (Stripe `pk_`, Firebase
web config, map keys restricted by domain) are fine. Say which ones were
found.

## Packages and supply chain

Before adding a package:
- The exact name exists on npm and links to the expected repository. Look out
  for typos and invented names (`react-dates-picker` vs the real one).
- It is maintained: recent releases, more than one maintainer, real downloads.
- Check the cost and the need first, as `frontend-performance` says.
- Use `resolve-versions.mjs` from `frontend-core`. It picks the newest version
  that fits the project's Node. Never change Node.

Keeping them safe:
- Commit `package-lock.json` (or the pnpm or yarn lock). CI installs with
  `npm ci`, never `npm install`.
- `npm audit --omit=dev` in CI. Fail on High and Critical in runtime packages.
  Dev-only findings are reported, not blocking.
- Turn on Dependabot or Renovate if the user agrees, grouped weekly.
- Packages that run install scripts (`postinstall`) are a risk. Prefer ones that
  do not need them.
- No `latest` or `*` ranges in `package.json`.

## CI checks to add, if the user wants them

1. `npm ci`
2. `npm audit --omit=dev --audit-level=high`
3. The build, then the `dist/` secret search above
4. A secret scan of the repo (for example gitleaks, or GitHub secret scanning
   and push protection, which are free for public repos)
5. Lint rules: `no-eval`, `no-implied-eval`, `no-new-func`, and
   `react/no-danger` set to warn

## Find it

```text
VITE_   import.meta.env   .env   sourcemap   server.host   --host
<script src="http   integrity=   unsafe-eval   unsafe-inline
"latest"   "*"   postinstall
```

Also look at the hosting files for the headers above, and at `.gitignore` for
`.env*.local`.
