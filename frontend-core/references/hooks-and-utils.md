# Hooks, utils and helpers

One implementation each. Check here and in the code before writing a new one.
Already in the template: `useControllableState`, `useMergedRefs`,
`useDebouncedCallback`, `useStableCallback`, `useDelayedLoading`, `useDisclosure`, `useLocalStorage`,
`useKeyboardShortcut`, `useOnlineStatus`, `useSidebar`, `useConfirm`,
`useTableState`, and utils `date`, `dom`, `csv`, `format-file-size`. With
`frontend-api`: `useAuth`, `usePermission`. Build the others when first needed.

Hooks use React. Utils are pure. Helpers with side effects (browser, storage,
network) live in `lib` or `services`.

## Core hooks (`src/hooks`)

| Hook | Returns / features |
| --- | --- |
| `useDisclosure(initial?)` | `isOpen, open, close, toggle` |
| `useDebounce(value, ms)` | debounced value, cleans up |
| `useDebouncedCallback(fn, ms)` | callback with `cancel` and `flush` |
| `useStableCallback(fn)` | never changes, runs the newest code; for memoized rows |
| `useControllableState` | one state for controlled and uncontrolled |
| `useMediaQuery(query)` | SSR safe; `useIsMobile` built on it |
| `useClickOutside(ref, fn)` | pointer events, multiple refs |
| `useKeyboardShortcut(keys, fn)` | Ctrl/Cmd, ignores typing in fields |
| `useLocalStorage(key, initial)` | typed, safe parse, cross-tab sync, SSR safe |
| `useClipboard()` | `copy, copied, error`, resets |
| `useQueryParams(schema)` | typed URL state, defaults, replace or push |
| `usePagination` | page, size, offset, resets when filters change |
| `useTableState` | sort, filter, page, selection, URL sync |
| `useSelection` | toggle, range, all, clear, indeterminate |
| `useScrollLock(active)` | nested safe, no layout shift |
| `useFocusReturn(active)` | returns focus on close |
| `useMergedRefs(...refs)` | combines refs |
| `useDelayedLoading(isLoading)` | prevents loader flicker |
| `useConfirm()` | `await confirm({...})` gives a boolean |
| `useUnsavedChanges(isDirty)` | route and tab-close warning |
| `useDocumentTitle(title)` | app name suffix |
| `useOnlineStatus()` | online state |
| `useAuth()`, `usePermission()` | user, sign in/out; `can`, `canAny`, `canAll` |
| `useFormServerErrors(form)` | maps API errors to fields, rest to form |

When needed: `useThrottle`, `useInterval`, `useTimeout`, `useCountdown`,
`usePrevious`, `useIntersection`, `useInfiniteScroll`, `useResizeObserver`,
`useScrollPosition`, `useHover`, `useIdle`, `useEventSource`, `useWebSocket`,
`useFileDrop`, `useUpload`, `usePrint`, `useFullscreen`, `useGeolocation`,
`useUndo`, `useStepper`, `useFeatureFlag`, `useTheme`, `useAutosave`.

## Core utils (`src/utils`)

| File | Functions |
| --- | --- |
| `format-date.ts` | `formatDate, formatTime, formatDateTime, formatDateRange, formatRelativeTime` |
| `date.ts` | `parseIsoDate, toIsoDate, isBefore, isAfter, isSameDay, addDays, startOfDay, differenceInDays` |
| `format-number.ts` | `formatNumber, formatCompact, formatPercent` |
| `format-currency.ts` | `formatCurrency, parseCurrency` |
| `format-file-size.ts` | `formatFileSize` |
| `format-phone.ts` | `formatPhone, toE164` |
| `string.ts` | `capitalize, toTitleCase, slugify, truncate, getInitials, maskText, pluralize, normalizeSearch` |
| `array.ts` | `groupBy, uniqueBy, sortBy, chunk, keyBy, sumBy, moveItem, toggleItem` |
| `object.ts` | `pick, omit, compact, isEqual, getDirtyValues` |
| `number.ts` | `clamp, round, toNumberOrNull, percentOf` |
| `guards.ts` | `isDefined, isNonEmptyString, isRecord, assertNever` |
| `query-string.ts` | `parseQuery, buildQuery, updateQuery` |
| `url.ts` | `isSafeUrl, isExternalUrl, isInternalPath, joinUrl` |
| `file.ts` | `getExtension, isImage, validateFile, readAsDataUrl, downloadBlob` |
| `options.ts` | `toOptions, findOption, getOptionLabel, filterOptions, groupOptions` |
| `error.ts` | `getErrorMessage, isApiError, isAbortError, isNetworkError` |
| `async.ts` | `sleep, retry, withTimeout` |
| `id.ts` | `createId` |
| `validators.ts` | `isEmail, isPhone, isUrl, isStrongPassword` |

When needed: CSV export/import, color contrast, image resize, HTML sanitize,
deep links, fuzzy search, table export, coordinates, timezone conversion.

## Core helpers

| File | Purpose |
| --- | --- |
| `lib/cn.ts` | class merge |
| `lib/query-client.ts` | cache defaults, global error handling |
| `lib/logger.ts` | quiet in production, removes sensitive data |
| `lib/zod.ts` | shared messages, when Zod is used |
| `services/api-client.ts` | every request |
| `services/api-error.ts` | one error shape |
| `services/storage.ts` | typed keys, safe JSON, prefix, versioning |
| `services/session.ts` | token in memory, sign out in all tabs |
| `services/upload.ts` | progress, cancel, retry |
| `config/env.ts` | validated environment |
| `config/query-keys.ts` | central key factory |
| `constants/messages.ts` | validation, success and error text |
| `constants/options.ts` | status, yes/no, gender, page size and similar lists |
| `constants/regex.ts` | shared patterns |
| `types/common.types.ts` | `Nullable, Option, AsyncState, WithChildren, ID` |
| `types/api.types.ts` | `ApiResponse, PaginatedResponse, ListParams, FieldErrors` |

## Rules

- Use the platform first: `Intl`, `URL`, `URLSearchParams`, `structuredClone`,
  `crypto.randomUUID`, `AbortController`.
- Handle null, undefined, empty, invalid and negative input. Formatters return
  "—" for missing values and never throw.
- No mutation of inputs. Explicit locale and timezone settings from app config;
  dates without time must not shift by timezone.
- Document non-obvious functions. Test every util and shared hook.
- No `helpers.ts` or `common.ts` dump file; name files by purpose.
- Do not create a util for one simple expression used once.
