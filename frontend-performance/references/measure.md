# Measure, leaks, hosting

Always the production build. Dev mode is several times slower.

```bash
npm run build && npm run size                        # limits; exit code 1 when over
npm run measure -- / /users                          # Lighthouse, 3 runs, middle one
npm run measure -- --url https://staging.example.com /
node scripts/performance/check-leaks.mjs /users /orders
```

In a project the scripts are in `scripts/performance/`. They need Chrome; from the
skill folder add `--project <folder>`.

- `measure` serves `dist` compressed, like hosting. There is no API there: pages
  that need data or login must be measured with `--url` on a test system. It tells
  you when a page redirected.
- Lab numbers vary. Differences under 5% are noise. Compare on the same computer.
- INP cannot be measured in the lab. TBT is the substitute; real values come from
  `reportWebVitals`. Use the 75th percentile, phones and computers separately.
- The report holds only the path. If paths contain personal data (names, emails),
  send the route pattern instead.

## Where is the time?

| High | Look at |
| --- | --- |
| TTFB | server, CDN, redirects |
| FCP | blocking CSS, fonts, scripts in the head, first-load size |
| LCP | main image late or too big, page code and data in a row, spinner before content |
| TBT, INP | large scripts, heavy render, long handlers, third-party code |
| CLS | images without size, late banners, font swap, skeleton of another size |

What is in a file: `npx vite build --sourcemap`, then a bundle viewer that supports
the installed Node, or search the file for known package names. Why a package is
there: `npm ls <package>`.

A timing in the browser, for one interaction:

```js
const start = performance.now(); button.click();
requestAnimationFrame(() => setTimeout(() => console.log(performance.now() - start)));
```

## Memory leaks

`check-leaks.mjs` visits two pages again and again and reports growth of memory,
elements and listeners per visit. Growth means something is kept: an effect without
cleanup, a module-level array or Map that only grows, a closure in a global
listener, a third-party widget never destroyed. Then Chrome DevTools, Memory, two
heap snapshots, "Comparison", filter "Detached". Pages behind a login: do the same
by hand.

## Hosting

`assets/hosting`: `nginx.conf`, `netlify/_headers` and `_redirects`, `vercel.json`.
Use the matching one and adapt it. Every host needs:

| Path | Cache |
| --- | --- |
| `/assets/*` (hashed names) | one year, immutable |
| `index.html` and all app paths | `no-cache` |

- Brotli or gzip for text; HTTP/2 or 3; a CDN near the users.
- A missing `/assets/*` file must be a 404, not `index.html`.
- Keep the assets of the last few releases, so open tabs keep working.
  `recoverFromStaleDeploy` handles the rest.

Check after a deploy:
`curl -sI -H "Accept-Encoding: br" https://…/assets/<file>.js` shows
`content-encoding` and `cache-control`.

## CI

After build: `npm run size`. `npm run measure` on a schedule or before a release,
because shared CI machines vary. Never raise a budget to make CI pass without
asking.
