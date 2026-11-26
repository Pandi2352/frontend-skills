# Planning a feature

Turn a request like "I need an orders module" into a plan the user can check
**before anything is built**. The plan comes from their words, their existing
project, and their backend (if any). Never from a stock example.

Show the plan, wait for OK or changes, then build it with `steps.mjs … build
feature:<name> --fields "…"` or `generate.mjs feature`, and change only what the
generator cannot know.

## 1. Collect what is known

Read before asking:
- The request itself: nouns are entities, verbs are actions, adjectives often
  hide states ("open orders", "overdue invoices").
- `docs/PROGRESS.md` and `docs/steps.json`: what is built. `src/config/navigation.ts`
  and `routes.ts`: existing menu and paths. `src/features/`: entities that
  already exist and can be linked.
- API docs, an OpenAPI file, a Postman collection, or backend code the user
  pointed to. Field names and types come from there when they exist.
- `src/config/permissions.ts`: roles that exist.

Ask only for what is still missing, in **one** message with at most 3 short
questions, each with a suggested answer. For example: "Can an order be edited
after it is paid? (I'd say no.)"

## 2. Entities and fields

For each entity: singular and plural name (in the user's words), the fields,
and the relations.

| Field idea | Generator type | Notes |
| --- | --- | --- |
| Name, title, code, reference | `text` | The field shown in lists and links. Mark it required (`!`) |
| Long description, notes | `textarea` | Not in the list, only in details |
| Email, website, phone | `email`, `url`, `phone` | |
| Count, quantity | `number` | |
| Money | `currency` | One currency from `appConfig` unless the user has many |
| Rate, discount | `percent` | |
| Date: due, start, born | `date` | Range filter in the list |
| Yes or no: active, paid, archived | `switch` | Often better as a status |
| Fixed set: status, type, priority | `select(a\|b\|c)` | Status values come in lifecycle order |
| Country | `country` | |
| Link to another entity (customer of an order) | `text` first, then change it to a `Combobox` that loads the other entity | Say this in the plan |

Rules:
- `id`, `createdAt` and `updatedAt` are added by the backend and the generator.
  Do not list them as fields.
- 5 to 10 fields for the first version. More can come later. Ask before
  adding fields the user did not mention, except for a name and a status.
- Every list needs one field people recognize the item by.
- Money is never `number`. Dates are never `text`.

## 3. Status and lifecycle

If the entity has a status, write the states and the moves between them:

```text
draft → open → paid
          ↘ cancelled
```

From this come: badge colors (one map), the allowed actions per state ("Mark
as paid" only when open), filters ("Open", "Paid"), and maybe a board view
(kanban). Deleting is often replaced by "Cancel" or "Archive" once an item is
in use. Ask.

## 4. Pages

The generator makes list, details, create and edit. Decide for each:

| Page | Decide |
| --- | --- |
| List | Columns (4 to 6: the name field, status, the key number, the key date, the relation), default sort, filters (status, date range, relation), search field, bulk actions, page size |
| Details | Header (name, status badge, main actions), facts on the side, related lists below (an order's lines, a customer's orders), activity timeline if changes matter |
| Create, edit | Field order and groups, which fields cannot change after creating, where the user goes after saving |
| Extra views | Board by status, calendar by date, a dashboard widget, import from CSV: only if they fit. Offer them as next steps (`frontend-blocks`), do not build them now |

Page types and their layouts: `frontend-blocks/references/page-recipes.md`.

## 5. Paths, menu and permissions

- **Paths**, in `ROUTES` (`src/config/routes.ts`): `/orders`, `/orders/new`,
  `/orders/:id`, `/orders/:id/edit`. Plural, kebab-case. Nested only when the
  child cannot exist alone (`/orders/:id/lines/:lineId`).
- **Menu**, in `navigation.ts`: which group it belongs to (by the user's work:
  "Sales", "Operations", "Admin"), its label, an icon that means this entity in
  this business (Phosphor, `layout-spec.md` section 5), and its position.
  Children only when there are real sub-pages ("All orders", "Returns").
- **Permissions**, in `permissions.ts`: `<plural>.read`, `<plural>.write`,
  `<plural>.delete`, plus one per special action (`orders.refund`). Map them
  to the roles the project has. If the backend sends permissions, use its names.

## 6. Data source

- Backend exists: list the endpoints the service will call, with methods. Mark
  each as **known** (from docs or code) or **assumed**.
- No backend yet: sample data, as `frontend-api/references/mock-data.md` says,
  with values from this business and every status represented.
- Never invent a base URL.

## 7. The plan to show

Keep it to one screen:

```markdown
**Orders: plan**

Fields: customer (text, required) · total (currency, required) · status (draft, open, paid, cancelled) · dueOn (date) · note (textarea)
Lifecycle: draft → open → paid; open → cancelled. No delete after open.

Pages:
- /orders: list with customer, status, total, due date; filter by status and due date; search by customer
- /orders/:id: details, actions "Mark as paid" and "Cancel"
- /orders/new, /orders/:id/edit: form; total cannot change after paid

Menu: group "Sales", "Orders", receipt icon, after "Customers"
Permissions: orders.read (all roles), orders.write (admin, sales), orders.cancel (admin)
Data: no backend yet, so sample data with 25 orders in src/mocks/data/orders.json
Later, if you want: board by status, CSV import

Build this? Or change something?
```

Then stop and wait.

## 8. After OK

1. Build with the field string from the plan.
2. Change only what the generator could not know: lifecycle actions,
   relation fields, columns and filters, menu icon and group, permissions.
3. `verify`, then tell the user what to check on screen, and suggest the
   "later" items as next steps.
