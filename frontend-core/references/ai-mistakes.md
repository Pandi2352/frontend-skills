# Common AI mistakes

Read this before you say that React work is done. Each one passes a quick look and
fails for real people.

## Invented things

- **Packages and APIs.** Is the package in `package.json`? If not, does it exist on
  npm, and is it needed? Never write an import from memory.
- **Props and variants.** Look them up in `docs/COMPONENTS.md` or the source. The
  type check finds the rest, so run it. Never silence it with `any`, `as` or
  `@ts-ignore`.
- **Endpoints and fields.** Take them from the API description, the backend code or
  the user. Otherwise ask, or write one service file and say it is assumed.
- **Icons and tokens.** Lucide names and `theme.css` tokens must exist; a wrong class
  does nothing and gives no error.
- **Results.** Never say "tests pass" without having run them.

## Left behind

- Fake data, names, images, waiting times and `console.log`.
- `// ... rest of the code`, empty handlers, `href="#"`, unused files and imports.
- A second version of something that exists. Search first.
- Changed behaviour nobody asked for: renamed props, removed cases, other texts.

## Effects

An effect connects to something outside React. If nothing outside is involved, there
is no effect.

| Mistake | Instead |
| --- | --- |
| `useEffect(() => setFull(a + b), [a, b])` | `const full = a + b` |
| effect that reacts to a click or submit | do it in the event |
| `fetch` in an effect | `useQuery` |
| copy of a prop or query in state | use it directly; `key={id}` to start again |
| effect that resets a form when the id changes | `key={id}` on the form |
| missing cleanup | return one for each listener, timer, observer, socket |
| dependency left out to stop a loop | move the function or object; `useStableCallback` for events |
| `useEffect(async …)` | async function inside, with a cleanup |

## Twice and at the same time

- Development runs effects twice. Code that breaks then is wrong; never remove
  `StrictMode`.
- **Double click:** `Form` and `Button isLoading` already block it. Other actions:
  disable while pending.
- **Race:** an old answer arrives last and wins. Pass `signal`, put every parameter
  in the query key. Own async code: ignore the answer when it is no longer wanted.
- **Waterfall:** independent requests together, not `await` after `await`.
- **Fast typing:** debounced; old results stay while loading.
- **Two updates in one event:** `setState((old) => …)` when the new value needs the
  old one. `setSearchParams` twice in one event loses the first.

## Old values

- A callback given to a timer, listener or memoized row sees old state. Use the
  updater form or `useStableCallback`.
- State is not changed on the next line. Keep the new value in a variable.
- `form.watch`, `form.formState` and `ref.current` while rendering: use `useWatch`
  and `useFormState`.
- Never change state in place: no `push`, `sort`, `splice` or `obj.x =` on it.
  Use copies, `toSorted`, `filter`, spread.
- After a mutation: invalidate or update the cache, also the list and the counter.

## Small ones

- `count && <X />` shows `0`. Use `count > 0 && …`.
- `value || 'default'` replaces `0` and `''`. Use `??`.
- `key={index}` in lists that change; `key={Math.random()}` anywhere.
- A component defined inside a component loses its state on every render.
- `new Date('2026-01-05')` is UTC and can show the day before. Use `utils/date`.
- `Number('')` is 0; `parseInt` without checking `NaN`; money as floating point sums.
- `JSON.parse` and `localStorage` can throw; answers from outside can have any shape.
- Links with `target="_blank"` without `rel`; URLs from data opened without a check.
- Optional chaining everywhere instead of handling "not loaded" once.
- Text in the code although the project has translations.

## States people forget

Loading, empty, no results, error with retry, no permission, offline, slow, very long
text, 0, 1 and 1000 items, no image, expired session, back button, reload in the
middle, double click, 360 px, keyboard only.

## Before "done"

1. Reread the request. Is everything in it there, and nothing else?
2. `scan.mjs` from `frontend-review`: finds many of the points above.
3. `typecheck`, `lint`, `test`, `build`. Read the output.
4. Look at it in the browser if you can: 360 and 1280 px, no console messages.
5. Say what you did not check.
