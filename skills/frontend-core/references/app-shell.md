# App shell: sidebar, navbar, pages

The full feature list and the rules users asked for: `layout-spec.md`. This file shows
how to use the code.

Finished and tested code is in the template. **Use it, do not rewrite it.**

```tsx
// app/router/router.tsx
export const routes: RouteObject[] = [{
  HydrateFallback: PageLoader,       // until the first lazy page is there
  children: [
  { element: <AuthLayout logo={<Logo />} />, children: [{ path: ROUTES.login, lazy: loginPage }] },
  {
    element: (
      <AppLayout
        nav={APP_NAV}
        can={can}                                    // from usePermission()
        header={<Logo />}
        footer={(collapsed) => <Version short={collapsed} />}
        navbar={{
          center: <NavbarSearch onOpen={openSearch} />,
          right: <><NotificationMenu … /><UserMenu user={user} onSignOut={signOut} items={[…]} /></>,
        }}
      />
    ),
    children: [...usersRoutes, { path: '*', element: <NotFoundPage /> }],
  },
  ],
}];
export const router = createBrowserRouter(routes);

// main.tsx
<AppProviders><RouterProvider router={router} /></AppProviders>
```

Use a small component around `AppLayout` when `can` and `user` come from hooks.

## Menu from the project

The sidebar shows the user's project, not one "Dashboard" item. Before or right after
the layout step, plan the menu from what they described, and write it into
`config/navigation.ts`:

- Groups by job, 2 to 4: e.g. a real estate CRM: **Overview** (Dashboard, Reports),
  **Sales** (Leads, Deals, Clients), **Listings** (Properties, Viewings), **Admin**
  (Team, Settings).
- A submenu only when an area has 2 or more pages (Properties: All, Add, Map). One level.
- A fitting Lucide icon per top item; children without icons.
- `badge` for counts people act on (new leads), `permission` for admin pages.
- Items for pages that do not exist yet: add the path to `ROUTES` and a page that says
  what will be there (`EmptyState` with an action), never a dead link. Tell the user which
  ones are placeholders; build each one only when they ask.

Show the planned menu in a few lines and let them change it before building pages.

## Menu

Edit only `config/navigation.ts` and `config/routes.ts`. Never edit the sidebar
to add a page.

```ts
{ id: 'users', label: 'Users', icon: Users, children: [
  { id: 'list', label: 'All users', to: ROUTES.users.list, exact: true, permission: 'users.read' },
] }
```

`NavItem`: `to`, `icon`, `badge`, `permission`, `exact`, `external`, `children`
(one level). Hiding an item is not security; guard the route and the server.

## Built in

- **Sidebar**: logo (`AppLogo`; replace the mark with the real logo), groups,
  submenus that open and close smoothly and stay as the person left them, parent opens
  for the current page, badges (a dot when collapsed), active mark, menu filter from 10
  items (`filterable`), collapse to icons with tooltips and fly-out submenus,
  remembered, Ctrl/Cmd+B, skeleton with `loading`, footer slot.
- **Phones**: drawer below `lg`, closes after navigation.
- **Navbar**: sidebar button at the left end (collapses on desktop, opens the drawer on
  phones), then where the page is in the menu (`NavTrail`; `navbar.trail: false` hides
  it); `left`, `center`, `right` slots; search with Ctrl/Cmd+K, user menu with name and
  role, notifications with loading, error and empty.
- **Layout**: skip link, only the page scrolls, focus and scroll on page change,
  scroll restored on Back, error boundary per page, lazy page skeleton, offline
  banner.

Change widths with `--spacing-sidebar`, `--spacing-sidebar-collapsed` and
`--spacing-header`. Navbar-only or public layout: use `Navbar` with `PageContainer`
and a footer; leave out `AppLayout`.

## Pages

```tsx
<PageContainer>              // full width; narrow for forms and text
  <PageHeader title="Users" description="…" breadcrumb={[…]} backTo={…} badge={…} actions={<Button>New</Button>} />
  …
</PageContainer>
```

`PageHeader` is the only `h1` and sets the browser tab title.

- List page: `PageHeader → FilterBar → DataTable`
- Details page: `PageHeader → sections`
- Form page: `PageHeader → Form → FormActions`

## Routing

Always `react-router-dom` (v7, imports such as `createBrowserRouter`, `NavLink`, `useNavigate` come from it). All in
`src/app/router/`:

| File | Holds |
| --- | --- |
| `router.tsx` | `createBrowserRouter(routes)` |
| `routes.tsx` | the tree: guards, layouts, `errorElement` |
| `app.routes.tsx` | pages inside the sidebar and navbar; features above `// features` |
| `auth.routes.tsx` | login, register and password pages |

- Paths only from `ROUTES`. Each feature exports its routes (`features/x/x.routes.ts`).
- Lazy-load pages. Error pages in `app/pages/StatusPages.tsx`: `NotFoundPage`,
  `ForbiddenPage`, `RouteErrorPage` (also offline and "new version"), centered, with an
  illustration in the theme colors and a way back. `StatusView` for other full-page states.
- `App.tsx` order: `QueryClientProvider` > `AuthProvider` > `AppProviders` > router.
  `src/app/App.test.tsx` fails when a provider is missing.
- Login and permission guards: `frontend-api` skill.
- Filters, sort, page and tab live in the URL (`useTableState`).
