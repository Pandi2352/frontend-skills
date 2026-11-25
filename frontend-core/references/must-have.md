# Must-have list

What a frontend project needs. Each item exists once and is reused everywhere.

- **Core**: build in every project during setup.
- **When needed**: build as a shared component the first time it is required.
  Do not build it earlier; unused code must still be maintained.

Features of each item: `fields-and-forms.md`, `components.md`, `app-shell.md`,
`hooks-and-utils.md`.

## Core

**Finished in the template** (copied by `add-to-project.mjs --components`)
- [x] All form fields, Form, FormField, FormSection, FormActions, RepeatableFields
- [x] Button, IconButton, DropdownMenu, Tooltip
- [x] Modal, Drawer, `useConfirm`
- [x] Toaster, all loaders and skeletons, Progress, Alert
- [x] EmptyState, NoResults, ErrorState, AsyncView, ErrorBoundary, OfflineBanner
- [x] AppLayout, AuthLayout, Sidebar, MobileSidebar, Navbar, UserMenu,
      NotificationMenu, NavbarSearch, skip link
- [x] PageContainer, PageHeader, PageToolbar, Breadcrumb, 403 and 404 pages
- [x] DataTable, FilterBar, RowActions, Pagination, `useTableState`
- [x] Badge, Avatar, theme tokens, base styles
- [x] Hooks: useControllableState, useMergedRefs, useDebouncedCallback,
      useStableCallback, useDelayedLoading, useDisclosure, useLocalStorage, useKeyboardShortcut,
      useOnlineStatus
- [x] Utils: date, dom, csv, format-file-size

**Finished in the `frontend-api` skill**
- [x] api-client, api-error, session, upload, query client, env, permissions
- [x] AuthProvider, ProtectedRoute, GuestRoute, PermissionRoute, CanAccess

**Finished in the `frontend-performance` skill**
- [x] Image, VirtualList, LazySection, page preloading, new-release recovery,
      web vitals, size limits, Lighthouse and leak checks, hosting files

**Build when the project needs it**
- [ ] Tabs, Accordion, Card, StatCard, KeyValueList, StatusBadge, CopyButton
- [ ] Other hooks and utils from `hooks-and-utils.md`
- [ ] Unsaved-changes guard, logger, messages and options constants

**Set up per project**
- [ ] Router, routes, navigation, app config, fonts, favicon, page titles and meta
- [ ] Playground routes in development only, `.env.example`, README, AGENTS.md

**Auth, when the app has accounts**
- [ ] Login, register, forgot and reset password, verify or OTP
- [ ] Session restore with a loader, token refresh, session-expired handling
- [ ] Sign out (clears cache), profile, change password

## When needed

| Area | Items |
| --- | --- |
| Fields (not in the template) | RichText, Markdown, Code editor, Mention, Captcha, Map picker, Image crop. Each needs a library or service; agree on it first. |
| Navigation | CommandMenu, Stepper, TreeView, MegaMenu, BottomNav, AnchorNav, BackToTop, WorkspaceSwitcher |
| Overlays | Sheet, ContextMenu, HoverCard, Lightbox, PdfViewer, ProductTour, Announcement bar |
| Data | Charts, Timeline, ActivityFeed, Calendar, Kanban, Gallery, Carousel, Accordion, SortableList, Comments, Chat, Map |
| Table | Export, import wizard, column pinning, resize, inline edit, expandable rows, tree rows, saved views |
| System | Notifications, realtime, i18n, RTL, theme toggle, PWA, print styles, idle logout, maintenance page, cookie consent, analytics, feature flags, error reporting, global search, upload queue, autosave |

## Feature contract for every shared item

Every item must meet the points that apply to it:

- [ ] Typed props; native props, `className` and ref pass through
- [ ] Shared `size` and `variant` names; tokens only
- [ ] Default, hover, focus, active, disabled, read-only, loading, error, empty
- [ ] Controlled and uncontrolled
- [ ] Custom content through `children`, slots or render props
- [ ] Keyboard, focus and screen reader support
- [ ] Long text, no data, large data, slow network, repeated clicks
- [ ] Mobile, zoom, reduced motion, and dark theme if enabled
- [ ] No business rules, API calls or hardcoded text inside `ui`
- [ ] Test, playground example, short usage note

"All features" means all that belong to that item. A feature used by one page
goes in that page through a slot, not as another prop on the shared component.
