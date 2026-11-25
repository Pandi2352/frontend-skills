# Loading

## Pages

```tsx
export const routes: RouteObject[] = [{
  element: <AppLayout … />,
  children: [
    { path: ROUTES.users.list, lazy: async () => ({ Component: (await import('@/features/users/pages/UsersPage')).UsersPage }) },
  ],
}];
export const router = createBrowserRouter(routes);
```

Layout, error pages and login shell are in the first load; everything else is
lazy. `preloadOnIntent(routes)` starts a page when its link is hovered, focused
or touched, for every link, and respects data saving. To start one yourself:
`preloadPath(routes, '/reports')`, for example after login.

## Parts of a page

```tsx
const EditUser = lazy(() => retryImport(() => import('./EditUser')).then((m) => ({ default: m.EditUser })));

{isOpen && <Suspense fallback={<FormSkeleton />}><EditUser id={id} /></Suspense>}
<LazySection fallback={<Skeleton className="h-80" />}><SalesChart data={data} /></LazySection>
```

- The fallback has the size of the content.
- Do not split what is always needed or smaller than about 5 kB; each file is a
  request.
- Actions: `const { exportXlsx } = await import('./export')` inside the handler,
  with a loading state on the button and a message if it fails.

## What our parts cost (compressed, with React 68 kB)

| Used | Total |
| --- | --- |
| Button, Form | 79 kB |
| Modal | 95 kB |
| any field: Input, Dropdown, DatePicker, FileUpload | 100 to 102 kB |
| DataTable | 109 kB |
| AppLayout with sidebar, navbar, router | 116 kB |
| PhoneInput | + 40 kB, loaded later by itself |

Parts share code, so they do not add up. One import from
`@/components/ui/fields` does not load the other fields.

## Packages

Before adding one: is it already possible with the platform or our utils? Does it
tree-shake? Is it needed on first load?

| Instead of | Use |
| --- | --- |
| moment, dayjs for formatting | `Intl`, `utils/date` |
| lodash | array methods, `utils/array`, `structuredClone` |
| uuid | `crypto.randomUUID()` |
| axios | `services/api-client` |
| icon packs, `icons` map | single Lucide icons |
| animation library for fades | CSS transitions |

## Images

```tsx
<Image src={photo.url} alt={photo.alt} width={1200} height={800}
  sources={[{ type: 'image/avif', srcSet: '…-600.avif 600w, …-1200.avif 1200w', sizes: '(min-width: 768px) 50vw, 100vw' }]} />
<Image src={hero} alt="" width={1600} height={600} priority />
```

- `priority` only on the main image. All others load late.
- Serve the shown size (times 2 for sharp screens), AVIF or WebP. Under 200 kB.
- Icons and logos: SVG. No base64 for large files. Video: `preload="none"` and a
  poster.
- Uploaded photos: let the server or an image CDN resize.

## Fonts

One variable font, self-hosted with Fontsource. `fonts.css` sizes the fallback so
text does not jump. No font from another server. Extra weights or families need a
reason.

## Third-party scripts

Analytics, chat, maps: never in the HTML head. `whenIdle(() => loadScript(…))`, or
after the first click on a placeholder. Ask the user before adding one; each can
break the targets alone.

## HTML

`<html lang>`, viewport, title. `<link rel="preconnect" href="https://api…">` when
the API is on another domain. Plain text or a logo inside `#root` shows something
before JavaScript runs.
