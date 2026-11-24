# Engineering standards

## React and TypeScript

- Functional components, named exports, focused files.
- `strict` and `noUncheckedIndexedAccess`. No `any`; `unknown` then narrow.
- Union types for variants. Discriminated unions for async state.
- `import type` for types. Avoid assertions and `!`.
- No `useEffect` for derived values or event logic. Clean up subscriptions,
  timers, listeners and requests.
- Local state first, then lifted, URL, context, store. Server data belongs in
  the query cache, not copied to state.
- Composition over prop drilling and many booleans.
- Stable keys. Memoize only after measuring. Early returns over nested JSX.
- Business logic in hooks and services. No generic abstraction before a second
  real use.

## API

`page → feature hook → feature service → api-client`

- `api-client` owns base URL, headers, timeout, abort, parsing, token refresh
  (one refresh at a time) and error normalization.
- Error shape: `{ status, code, message, fieldErrors?, requestId? }`.
- Shared `ApiResponse<T>` and `PaginatedResponse<T>`.
- Handle 401 refresh or sign-out, 403, 404, 409, 422 field errors, 429, 5xx,
  offline. Retry only safe requests.
- Cancel stale requests. Map API shape in `*.mapper.ts`. Central query keys;
  invalidate after mutation. Optimistic updates need rollback.

## Auth and security

- Prefer httpOnly, secure, same-site cookies. Avoid tokens in local storage.
- Permissions in `config/permissions.ts`; use `usePermission` and `CanAccess`.
- No `dangerouslySetInnerHTML` without sanitizing. Validate URLs.
- `rel="noopener noreferrer"` on external new tabs.
- Secrets never in frontend. Every `VITE_` value is public. Commit only
  `.env.example`; validate env at startup.
- Clear cached user data on sign-out. No personal data in logs.

## Performance

- Route splitting; lazy-load charts, editors and maps.
- Image dimensions, modern formats, lazy below the fold.
- Debounce search; virtualize long lists; watch bundle size.
- Prevent layout shift with matching skeletons.

## Content and i18n

Sentence case. Buttons name the action ("Save changes", not "Submit"). Shared
messages in constants. If multiple languages are needed, no hardcoded text and
use logical properties (`ms-`, `pe-`) for RTL.

## Testing and quality

- Test behaviour by role and label, not implementation or snapshots.
- Cover keyboard, loading, error, disabled and validation for shared UI.
- Mock at the network boundary. Use `test/render.tsx` for providers.
- E2E for critical flows when the project requires it.
- ESLint with hooks and accessibility rules (`eslint-plugin-jsx-a11y-x`, because
  the original plugin does not support ESLint 10), Prettier with Tailwind sorting.
- Block native controls in lint with `no-restricted-syntax` on JSX elements
  `select` and `datalist`.
- Conventional commits; CI runs lint, typecheck, test, build.

## Component done check

- [ ] Reused existing parts; no duplicate created
- [ ] Tokens only, `rounded-md`, no shadow
- [ ] Field height and style match the others
- [ ] Strict types, ref, `className`
- [ ] Default, hover, focus, active, disabled, loading, empty, error, read-only
      where relevant
- [ ] Keyboard and screen reader names
- [ ] 360, 768, 1280px; 200% zoom; long text; no data; many items
- [ ] Controlled and uncontrolled where relevant
- [ ] Tests, playground entry, prop documentation
- [ ] No console warnings; lint, typecheck, test and build pass
