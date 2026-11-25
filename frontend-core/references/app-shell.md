# App shell: sidebar, navbar, pages

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

- **Sidebar**: groups, nested items, badges, active mark, parent opens for the
  current page, collapse to icons with tooltips and menus, remembered, Ctrl/Cmd+B,
  skeleton with `loading`, header and footer slots.
- **Phones**: drawer below `lg`, closes after navigation.
- **Navbar**: `left`, `center`, `right` slots; search with Ctrl/Cmd+K, user menu,
  notifications with loading, error and empty.
- **Layout**: skip link, only the page scrolls, focus and scroll on page change,
  scroll restored on Back, error boundary per page, lazy page skeleton, offline
  banner.

Change widths with `--spacing-sidebar`, `--spacing-sidebar-collapsed` and
`--spacing-header`. Navbar-only or public layout: use `Navbar` with `PageContainer`
and a footer; leave out `AppLayout`.

## Pages

```tsx
<PageContainer>
  <PageHeader title="Users" description="…" breadcrumb={[…]} backTo={…} badge={…} actions={<Button>New</Button>} />
  …
</PageContainer>
```

`PageHeader` is the only `h1` and sets the browser tab title.

- List page: `PageHeader → FilterBar → DataTable`
- Details page: `PageHeader → sections`
- Form page: `PageHeader → Form → FormActions`

## Routing

- Paths only from `ROUTES`. Each feature exports its routes.
- Lazy-load pages. 403, 404 and error pages have a way back.
- Login and permission guards: `frontend-api` skill.
- Filters, sort, page and tab live in the URL (`useTableState`).
