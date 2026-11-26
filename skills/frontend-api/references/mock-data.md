# Sample data when there is no backend

Use this when the user has not given an API (no OpenAPI file, no endpoints, no
`VITE_API_URL`). Never invent server addresses and call them as if they were real. The app
must still run and look real, so build sample data **for this project**: its business,
its features and its fields. Nothing here is copied from the skill; you write it.

## 1. Plan the data from the project

Read what the user asked for and `src/features/*/types/*.types.ts`. For each feature:

- one JSON file with 8 to 15 records, typed like the feature's type (`id` as text,
  `createdAt` as ISO time)
- values that fit the business: for a real estate CRM, property titles, real-looking
  addresses, prices in the right currency (`appConfig`), agents, lead sources; for a clinic,
  patients, doctors, appointment times
- every choice of a select field at least once, a few empty optional fields, one long text,
  dates spread over the last weeks, so lists, filters, sorting and empty cells can be checked
- records that refer to each other use the same ids (a deal's `propertyId` exists in
  `properties.json`)

Also the data the ready parts need, only if the project has them: the signed-in person
(`auth/me`), dashboard numbers that match the feature records, notifications about them.

## 2. Where it goes

```
src/mocks/
  README.md            what each file is, which request it answers, how to remove it
  data/
    properties.json    GET /properties (list) and GET /properties/:id
    leads.json
    auth-me.json       GET /auth/me  (path with "/" → "-")
  mock-fetch.ts        answers requests from data/ (written by you, see 3)
```

`README.md` has one row per file: file, request, fields, and what it is for. Update it
whenever you add or change a file.

## 3. Connect it without touching features

Services always call `api` with the real paths. Only `src/services/api.ts` decides:

- `VITE_API_URL` empty (or `VITE_API_MOCK=true`): pass `fetch: mockFetch` to
  `createApiClient`; load `@/mocks/mock-fetch` with a dynamic `import()` so it is not in
  the production bundle when a server is set.
- `config/env.ts`: `apiUrl` may be empty; add `mock: !apiUrl || VITE_API_MOCK === 'true'`.
- `.env.example`: `VITE_API_URL=` with a comment that empty means sample data.

`mock-fetch.ts` has the signature of `fetch` and returns `Response` objects:

- data files with `import.meta.glob('./data/*.json', { import: 'default' })`
- a list file: `GET` answers `{ items, total, page, pageSize }` from `page`, `pageSize`,
  `search`, `sort=field:asc|desc` and equal filters; `GET /x/:id` one record or 404;
  `POST`, `PATCH`, `DELETE` change an in-memory copy
- an object file: returned as it is
- login: any email and password; logout makes the next refresh answer 401
- a short delay (about 300 ms) so loading states show; respect `init.signal`
- unknown request: 404 with a message naming the file to add, and `console.warn`

Keep it in one file, about 100 lines. No packages (no MSW, no json-server) unless the
user asks.

## 4. Tell the user

After building: which files were created, that the app uses sample data, and that setting
`VITE_API_URL` switches to the real server (then delete `src/mocks/`). Tests keep mocking
the services with `vi.mock`, not this data.
