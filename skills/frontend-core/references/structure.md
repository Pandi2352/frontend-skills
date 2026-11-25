# Folder and file structure

The template copies most of this. Create the rest when it is first needed.

```text
project-root/
├── public/                         # favicon, robots.txt, static files
├── src/
│   ├── main.tsx                    # mount only
│   │
│   ├── app/                        # wires the application together
│   │   ├── App.tsx
│   │   ├── providers/
│   │   │   └── AppProviders.tsx    # confirm, toaster, error boundary
│   │   ├── router/
│   │   │   └── router.tsx          # lazy routes
│   │   ├── layouts/
│   │   │   ├── AppLayout.tsx       # sidebar + navbar + page
│   │   │   └── AuthLayout.tsx      # login, register, reset
│   │   └── pages/                  # app-level pages only
│   │       ├── StatusPages.tsx     # 403, 404
│   │       ├── FieldsPlayground.tsx      # dev only
│   │       └── ComponentsPlayground.tsx  # dev only
│   │
│   ├── components/
│   │   ├── ui/                     # primitives: no business logic, no API
│   │   │   ├── button/             # Button, IconButton
│   │   │   ├── fields/             # every form field, finished in the template
│   │   │   │   ├── base/           # shared look and behaviour
│   │   │   │   │   ├── FieldShell.tsx    # label, required, error, helper
│   │   │   │   │   ├── ControlFrame.tsx  # border, icons, clear, spinner
│   │   │   │   │   ├── field.styles.ts   # the only place for control styles
│   │   │   │   │   ├── field.types.ts
│   │   │   │   │   ├── useField.ts       # ids, ARIA, state
│   │   │   │   │   ├── usePopup.ts  PopupPanel.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── text/           # Input, Password, Search, Textarea, Masked, Otp, Tags, InlineEdit
│   │   │   │   ├── number/         # Number, Currency, Percent, Slider, Rating
│   │   │   │   ├── choice/         # Checkbox, RadioGroup, Switch
│   │   │   │   ├── select/         # Dropdown, Combobox, MultiDropdown, TreeSelect, TransferList, presets
│   │   │   │   ├── date/           # Date, Range, Time, DateTime, Month, Year, Calendar
│   │   │   │   ├── location/       # Phone, Country, State, City, Address
│   │   │   │   ├── upload/         # File, Image, Avatar, Signature
│   │   │   │   ├── other/          # ColorPicker
│   │   │   │   ├── fields.contract.test.tsx   # same checks on every field
│   │   │   │   ├── fields.behaviour.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── toast/              # toast-store.ts, Toaster.tsx
│   │   │   ├── loader/             # Spinner.tsx, Loaders.tsx
│   │   │   ├── skeleton/           # Skeleton.tsx
│   │   │   ├── modal/              # Dialog.tsx (base), Modal.tsx (Modal, Drawer)
│   │   │   ├── dropdown-menu/  tooltip/  pagination/
│   │   │   ├── alert/  badge/  avatar/
│   │   │   ├── tabs/  accordion/  card/  stepper/  timeline/
│   │   │   ├── copy-button/  key-value-list/
│   │   │   └── overlays.test.tsx
│   │   │
│   │   ├── form/                   # React Hook Form bindings
│   │   │   ├── Form.tsx            # submit once, server errors, first error focus
│   │   │   ├── FormField.tsx       # gives value, error and ref to a field
│   │   │   ├── FormSection.tsx  FormActions.tsx  RepeatableFields.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── layout/                 # application shell
│   │   │   ├── navigation.ts       # NavItem types, filter, active
│   │   │   ├── sidebar/            # Sidebar, SidebarNav, SidebarProvider, sidebar-context
│   │   │   ├── navbar/             # Navbar, NavbarSearch, UserMenu, NotificationMenu
│   │   │   ├── page/               # PageContainer, PageHeader, Breadcrumb, PageToolbar
│   │   │   └── layout.test.tsx
│   │   │
│   │   └── shared/                 # composed from ui, used by many features
│   │       ├── confirm/            # ConfirmProvider, useConfirm
│   │       ├── data-table/         # DataTable, FilterBar, RowActions, useTableState, process
│   │       ├── command-menu/
│   │       ├── states/             # EmptyState, NoResults, ErrorState, AsyncView, OfflineBanner
│   │       ├── error-boundary/
│   │       └── shared.test.tsx
│   │
│   ├── features/                   # one folder per business module
│   │   ├── auth/                   # from frontend-api: provider, guards, service
│   │   └── users/
│   │       ├── pages/
│   │       │   ├── UsersListPage.tsx
│   │       │   ├── UserDetailsPage.tsx
│   │       │   ├── UserCreatePage.tsx
│   │       │   └── UserEditPage.tsx
│   │       ├── components/
│   │       │   ├── UserForm.tsx    # one form for create and edit
│   │       │   ├── UsersTable.tsx
│   │       │   └── UserFilters.tsx
│   │       ├── hooks/
│   │       │   ├── useUsers.ts
│   │       │   ├── useUser.ts
│   │       │   └── useSaveUser.ts
│   │       ├── services/
│   │       │   ├── users.service.ts
│   │       │   └── users.mapper.ts # API shape to UI shape
│   │       ├── schemas/user.schema.ts
│   │       ├── types/user.types.ts
│   │       ├── constants/user.constants.ts
│   │       ├── users.routes.tsx
│   │       └── index.ts            # public API of the feature
│   │
│   ├── services/
│   │   ├── api-client.ts           # the only place that performs requests
│   │   ├── api-error.ts            # normalized error
│   │   ├── api.ts                  # the client every feature uses
│   │   ├── session.ts              # token in memory
│   │   └── upload.ts               # upload with progress
│   │
│   ├── hooks/                      # app-wide hooks; list in hooks-and-utils.md
│   │   ├── useDisclosure.ts
│   │   ├── useDelayedLoading.ts
│   │   └── ...
│   │
│   ├── config/
│   │   ├── env.ts                  # validated VITE_ variables
│   │   ├── navigation.ts           # sidebar and navbar items
│   │   ├── routes.ts               # every path, as constants
│   │   ├── permissions.ts
│   │   └── app.config.ts           # name, logo, page sizes
│   │
│   ├── constants/                  # ui-text.ts, field-text.ts, countries.ts, ...
│   ├── lib/                        # cn.ts, locations.ts, query-client.ts
│   ├── utils/                      # list in hooks-and-utils.md
│   ├── types/                      # api.types.ts, common.types.ts
│   ├── styles/
│   │   ├── index.css               # imports only
│   │   ├── theme.css               # tokens
│   │   └── base.css
│   ├── assets/                     # images/, icons/, fonts/
│   └── test/                       # setup.ts, render.tsx, factories/
│
├── .env.example                    # committed; real .env files are not
├── .gitignore  .prettierrc  eslint.config.js
├── docs/standards/                 # these standards, readable by any AI or person
├── docs/COMPONENTS.md              # short list of what exists, generated
├── scripts/                        # generate, verify, index-components, scan, resolve-versions
├── AGENTS.md                       # rules for every AI tool
├── CLAUDE.md  GEMINI.md            # one line each, pointing to AGENTS.md
├── README.md
├── index.html  package.json
└── tsconfig*.json  vite.config.ts
```

## Where does it go?

| The code is... | Put it in |
| --- | --- |
| Generic UI with no business meaning | `components/ui` |
| Form library binding | `components/form` |
| Sidebar, navbar, page frame | `components/layout` |
| Built from ui, used by 2+ features | `components/shared` |
| Used by one feature | `features/<name>` |
| React behaviour used by 2+ features | `hooks` |
| Pure function, no React | `utils` |
| Third-party setup | `lib` |
| Fixed app settings | `config` |

## Import direction

```text
app → features → components/shared → components/form → components/ui → hooks, lib, utils
        components/layout → components/ui and config
```

- Never import upward. `ui` does not import `features`, services or routing.
- A feature does not reach inside another; use its `index.ts`.
- `@/` for cross-folder imports, `./` inside the same folder.
- Barrel `index.ts` per component or feature. No circular imports.

## Naming

| Item | Style | Example |
| --- | --- | --- |
| Folder | kebab-case | `date-picker/` |
| Component file | PascalCase | `DatePicker.tsx` |
| Hook | camelCase with `use` | `useDebounce.ts` |
| Utility | kebab-case | `format-date.ts` |
| Styles, types, schema, service | dotted suffix | `user.schema.ts` |
| Page | `Page` suffix | `UsersListPage.tsx` |
| Constant | UPPER_SNAKE_CASE | `PAGE_SIZES` |
| Boolean | is/has/can/should | `isLoading` |
| Event prop, handler | onX, handleX | `onChange`, `handleChange` |
| Test | next to source | `Button.test.tsx` |

Named exports. Default export only where lazy routes need it. Keep tiny
components in one file; add types/styles/test files when they earn it. Split a
component around 200 lines or when it has more than one job.
