# Base layout: sidebar, navbar, page area, routes

The complete list of what the base layout of an app must have. Build against it, check
against it, and tell the user which items are done. The finished code in the template
(`components/layout/`, `app/layouts/`, `app/router/`, `app/pages/StatusPages.tsx`) already
does most of it: reuse it, do not rewrite it. What depends on the project (menu items,
icons, logo, texts) you write for that project.

## 0. Problems users found before. Never again

| Problem | Rule |
| --- | --- |
| Sidebar had one "Dashboard" item and looked empty | Plan the menu from the project (section 3) and show it to the user first |
| Collapse button sat inside the sidebar header | It is the first thing at the left end of the navbar |
| Submenus were missing or did not open and close | Parents with children open and close, animated, state remembered |
| Icons looked like every AI-made app (default Lucide outline) | Menu icons from Phosphor, duotone (section 5) |
| UI looked AI-made: plain, same grey everywhere | Section 6: logo, hierarchy, active states, spacing, one accent; full guide in the `frontend-design` skill |
| Empty space left and right of the page | Page area uses the full width; only forms and long text are narrow |
| Error pages were a small text on the left | Centered, with an illustration (SVG in theme colors), code, title, text, actions |
| `No QueryClient set` at start | Provider order in `App.tsx` (section 8); `App.test.tsx` checks it |
| Routes in one big file, or another router | `react-router-dom` only, files in `src/app/router/` (section 8) |
| A backend address was invented | No backend given: sample data, `frontend-api/references/mock-data.md` |
| `index.html` incomplete | Section 9 |

## 1. Structure

```
┌───────────────┬──────────────────────────────────────────────────┐
│ Logo  Name    │ [≡] Group › Parent › Page      search   🔔 🌙 (A)│  navbar, h-header
├───────────────┼──────────────────────────────────────────────────┤
│ GROUP         │                                                  │
│ ▣ Dashboard   │  Page title                         [ Action ]   │
│ ▣ Properties ▾│  filters / tabs                                  │
│   │ All       │  content, full width                             │
│   │ Add       │                                                  │
│ ▣ Leads    12 │                                                  │
│ ───────────── │                                                  │
│ (A) Name  ⋯   │                                                  │  optional footer
└───────────────┴──────────────────────────────────────────────────┘
```

- The window does not scroll; only the page area (and the menu, when long) scrolls.
- Sidebar from `lg` (1024 px) up; below that a drawer from the start side.
- Navbar and sidebar header have the same height (`--spacing-header`) and one line between
  them, so the borders meet.
- Widths: `--spacing-sidebar` (16 rem, range 15 to 17.5), `--spacing-sidebar-collapsed`
  (4 rem). Change only these tokens.

## 2. Sidebar: every feature

**Header**
- Logo mark and app name (`AppLogo`). Replace the mark with the real logo when there is one.
  Collapsed: mark only, centered. Clicking it goes to the start page (optional).
- Optional: workspace or company switcher (dropdown) under or instead of the name.

**Menu**
- Groups with a small uppercase label (Overview, Sales, Admin). Collapsed: a short line
  instead of the label, the label stays for screen readers.
- Items: icon, label, optional badge (count), optional external-link mark.
- Submenus, one level: chevron rotates, children slide open (height animation, off with
  `prefers-reduced-motion`), a thin guide line on the left of the children.
- Open and closed submenus are remembered (local storage) per item.
- The parent of the current page opens by itself until the person closes it.
- Active item: tinted background, accent text, a short bar at the start edge. Its parent is
  marked as well. Exact match for the start page (`exact: true`).
- Hover and focus states on every row; focus ring visible on keyboard only.
- Long labels truncate with the full text as a title; never wrap into two lines.
- Badges: numbers people act on (new leads). Collapsed: a small dot on the icon.
- Items hidden by permission (`permission` on the item); empty groups and parents disappear.
  Hiding is not security: guard the route and the server too.
- Filter field above the menu when it has 10 items or more (`filterable`): matches labels of
  items and children, opens matching parents, Escape clears, "No page matches" when empty.
- Loading: skeleton rows while permissions load (`loading`).
- Optional pinned area at the bottom: help, what is new, settings.

**Collapsed (icon rail)**
- Toggle: navbar button and Ctrl/Cmd+B. Remembered across reloads.
- Only icons, centered, same size; tooltip with the label on hover and focus.
- A parent opens its children as a fly-out menu to the right, with the parent name on top.
- Badge as a dot. Group labels as divider lines.

**Footer (optional)**
- The signed-in person (avatar, name, role) with a menu, or plan / storage usage, or the
  app version. When the navbar has the user menu, do not repeat it here.

**Phones and tablets (below `lg`)**
- The navbar button opens the menu as a drawer from the start side, with a backdrop.
- Focus moves into the drawer and is trapped; Escape, the backdrop and the close button
  close it; focus returns to the button.
- Choosing a page closes it. The page behind does not scroll while it is open.
- Same groups, submenus, badges and filter as on desktop.

## 3. Menu from the project

Plan it before building pages, show it in a few lines, let the user change it.

- 2 to 4 groups by the jobs people do, not by data tables. Example for a real estate CRM:
  **Overview** (Dashboard, Reports), **Listings** (Properties ▸ All, Add, Map; Viewings),
  **Sales** (Leads, Deals, Clients), **Admin** (Team, Settings).
- 5 to 9 top items in total; more goes into submenus or a second group.
- A submenu only when an area has 2 or more pages. One level only.
- The most used item first. Settings and admin last.
- Every item gets a path in `ROUTES` and a page. A page that is not built yet shows an
  empty state that says what will be there, never a dead link. Tell the user which ones.
- Write it in `src/config/navigation.ts` only. Never edit the sidebar to add a page.

## 4. Navbar: every feature

Left to right:

1. **Sidebar button** at the very left end: collapses the sidebar on desktop, opens the
   drawer on phones. Icon shows the state; `aria-expanded`; Ctrl/Cmd+B.
2. **Where am I** (`NavTrail`): group › parent › page from the menu, from `md` up. Earlier
   steps are links. Pages with their own breadcrumb (details pages) may hide it.
3. **Center**: search or command menu (Ctrl/Cmd+K, shown as a hint), an icon on phones.
4. **Right**, in this order, only what the project has: quick create button, language,
   theme (light, dark, system), help, notifications (bell with unread count, panel with
   list, mark all read, view all, empty and error states), user menu.
5. **User menu**: avatar (image or initials), name and role from `md` up, chevron. Menu:
   name and email on top, Profile, Settings, theme, then Sign out last.

Also: sticky, same height as the sidebar header, one bottom line, no shadow; an offline
banner above it when the connection is lost; a skip link "Skip to main content" as the
first focusable element.

## 5. Icons

- Menu icons: **Phosphor** (`@phosphor-icons/react`), names ending in `Icon`
  (`SquaresFourIcon`, `BuildingsIcon`, `UsersThreeIcon`, `HandshakeIcon`,
  `CalendarDotsIcon`, `ChartLineUpIcon`, `GearSixIcon`). The sidebar draws them in
  **duotone** (`IconContext` in `SidebarNav`), 20 px. This is what makes the menu look
  designed and not default.
- Choose an icon for its meaning in this business, not the first match. No two items with
  the same icon. Children have no icons.
- Small interface icons (chevrons, close, search) stay Lucide in the components.
- `NavItem.icon` accepts any SVG icon component, so a project may use its own icon set
  (Tabler, Hugeicons) or its own SVGs. One set for the whole menu.

## 6. Look: not AI-made

- One accent color (the project color) used for: active item, primary button, focus, logo.
  Everything else neutral.
- Hierarchy by size and weight, not by color: group labels 11 px uppercase, items 14 px,
  page title 24 to 30 px semibold.
- Sidebar white (`surface`), page area slightly tinted (`page`), so the frame and the
  content separate without shadows.
- Rows 36 px high, `rounded-md`, consistent 12 px horizontal padding.
- Icons muted when idle, accent when active; text muted when idle, strong when active.
- No gradients, no glass, no big shadows, no emoji in the menu.
- Dark mode: own tokens, the same rules.
- Check at 360, 768, 1024, 1440 px and with a long app name and long labels.

## 7. Page area

- **Full width** next to the sidebar (`PageContainer`): `p-4`, `md:p-6`, `xl:px-8`. No
  `max-w-*` with `mx-auto` around normal pages. `narrow` only for forms and reading text.
- Page header: title (the only `h1`, also the browser tab title), description, actions on
  the right, optional back button, badge and breadcrumb for deep pages.
- Order: header → toolbar (search, filters, view) → content.
- Every page has loading (skeleton of the real shape), empty (with action), error (with
  retry) states.
- On page change: focus moves to the page, scroll goes to the top; Back restores the old
  scroll position.
- Each page has its own error boundary: one broken page does not break the frame.
- Lazy pages: a skeleton while the page code loads.

## 8. Routes: always `react-router-dom`

All routing imports come from `react-router-dom` (v7): `createBrowserRouter`,
`RouterProvider`, `NavLink`, `Link`, `Outlet`, `useNavigate`, `useLocation`, `useParams`,
`useSearchParams`, `useRouteError`, types such as `RouteObject`. No other router.

```
src/app/router/
  router.tsx        createBrowserRouter(routes), nothing else
  routes.tsx        the tree: root with errorElement and HydrateFallback, guest routes
                    (login...) in AuthLayout, protected routes in AppShell
  app.routes.tsx    pages inside the frame; features are added above "// features"
  auth.routes.tsx   login, register, verify, forgot and reset password
src/config/routes.ts         every path as a constant (ROUTES), never a string elsewhere
src/features/x/x.routes.ts   the routes of one feature, spread into app.routes.tsx
```

- Every page lazy: `{ path, lazy: async () => ({ Component: (await import('…')).Page }) }`.
- Root `errorElement: <RouteErrorPage />`; `{ path: '*', element: <NotFoundPage /> }` as the
  last route inside the frame, so a wrong address keeps the menu.
- Guards: `GuestRoute` (signed-in people go to the app), `ProtectedRoute` (others go to
  login and come back to the page they wanted), permission checks show `ForbiddenPage`.
- Filters, sort, page and tab in the URL (`useSearchParams` / `useTableState`).
- Provider order in `App.tsx`: `QueryClientProvider` > `AuthProvider` > `AppProviders`
  (error boundary, confirm, toaster) > `RouterProvider`. Anything that uses queries must be
  inside `QueryClientProvider`. `src/app/App.test.tsx` renders the app and fails when a
  provider is missing.
- Preloading pages on hover and recovering from a new deploy: `frontend-performance`.

## 9. `index.html`

`lang` from the locale, charset, viewport, title, description, `theme-color` with the
project color, SVG favicon, `noscript` message, `#root`, the module script. With dark
mode: the small script that sets the theme before the first paint.

## 10. Error and status pages

In `app/pages/StatusPages.tsx`, shared `StatusView`:

- **404 Page not found**, **403 No access**, **500 Something went wrong** (route error),
  **Offline**, **New version available** (old page file gone after a deploy → Reload).
- Centered horizontally and vertically in the space they get: inside the frame (404 and
  403 keep the menu) or the whole window (route errors).
- An illustration as inline SVG drawn with theme tokens (`fill-primary`,
  `fill-primary-subtle`, `stroke-line`), so it fits every color and dark mode. No image
  files, no external links.
- Small code (404) in the accent color, title, one or two sentences, then actions: "Go to
  the start page" (primary) and "Go back" or "Try again" (outline).
- Sets the browser tab title. Errors are logged in development only.

## 11. Accessibility

- Landmarks: `header`, `nav` labelled "Main menu", `main` with id `main-content`, the
  trail `nav` labelled "Current location".
- Current page: `aria-current="page"`. Parents: `aria-expanded` and `aria-controls`;
  closed children cannot be reached (`inert`).
- Collapsed icons have their name for screen readers; tooltips also on focus.
- Keyboard: Tab through everything in order, Enter and Space open parents, arrow keys in
  menus, Escape closes drawer, menus and popups, focus returns to what opened them.
- Contrast WCAG AA for text, icons and focus ring, also for muted text and badges.
- Touch targets at least 40 px on phones. Works in RTL (start and end, not left and right).

## 12. Behaviour and performance

- Sidebar state (collapsed, open parents) in local storage, read without a flash.
- Menu, trail and permissions computed once per change (`useMemo`), not on every render.
- No layout jump when the page loads: fixed heights for navbar, sidebar rows, skeletons.
- No animation of width or height of the whole sidebar; only colors, transforms, and the
  submenu grid rows.

## 13. Done when

- [ ] Menu planned from the project, shown to the user, in `config/navigation.ts`
- [ ] Phosphor duotone menu icons, one per top item, all different
- [ ] Toggle at the navbar's left end; Ctrl/Cmd+B; collapsed state remembered
- [ ] Submenus open, close, animate, remember; parent of the current page open and marked
- [ ] Collapsed rail: tooltips, fly-out submenus, badge dots
- [ ] Drawer on phones closes on navigation and Escape, returns focus
- [ ] Location trail in the navbar; user menu with name and role
- [ ] Pages use the full width; 360 px has no side scroll
- [ ] 404, 403, route error pages centered with illustrations
- [ ] Routes in `src/app/router/`, all imports from `react-router-dom`, every page lazy
- [ ] Provider order right; `App.test.tsx` passes; `verify.mjs` passes
- [ ] No backend: sample data as `mock-data.md` says
