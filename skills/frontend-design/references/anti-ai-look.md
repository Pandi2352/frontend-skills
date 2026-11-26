# The AI look, and how to remove it

Go through a screen and look for each tell. One tell alone is fine. Three or
more make the screen look generated. Fix them all.

## Color

| Tell | Fix |
| --- | --- |
| Purple, indigo or violet to blue gradient on hero, buttons or headings | Solid brand color. No gradient text |
| Default Tailwind `blue-600` or `indigo-500` while the brand has its own color | Build the scale from the brand color (`visual-system.md`) |
| Pure grey `slate`/`gray` everywhere, cold and flat | Neutrals tinted toward the brand hue |
| Every icon in a colored circle (`bg-blue-100 text-blue-600`), each a different color | Icons in `muted`, without circles. Color only when it means status |
| Green "+12.5%" on every stat card | Show change only when it is real, with its period ("vs last month"), and colored by whether it is good or bad, not by its sign |
| Rainbow charts | One hue in different tints. Accent for the series that matters, grey for the rest |
| Dark mode made by inverting colors, with pure black (`#000`) and pure white text | Its own tokens: dark grey surfaces in 2 or 3 steps, off-white text |

## Shape and depth

| Tell | Fix |
| --- | --- |
| `rounded-2xl` or `rounded-3xl` cards with `shadow-lg` or `shadow-xl` | One radius token. Flat cards with 1 px border |
| Glassmorphism: `backdrop-blur`, white/10 panels, glows | Solid surfaces |
| Cards inside cards inside cards | One level. Inside a card use space and dividers |
| Every section in its own bordered box | Group with space and headings. Borders only where content needs a frame (tables, forms, cards of the same kind) |
| Big soft colored blobs or blurred circles in the background | Plain `page` color |

## Layout

| Tell | Fix |
| --- | --- |
| Everything centered, in a narrow column, on a wide screen | Left-aligned, full width for data, narrow only for forms and reading |
| Three equal feature cards with icon, title, two lines | Content in the shape it really has: a list, table, or one main item and smaller ones |
| Four equal stat cards on top of every dashboard | Only the numbers people act on. The main one larger, the others smaller or in one row |
| Same padding and size for everything, so nothing stands out | A clear first thing per page: title and main action, then the main content |
| Huge hero headers inside an app ("Manage your orders effortlessly") | Compact page header: title, short description if needed, actions on the right |
| Too much empty space and few items on a work screen | Density from the direction. Work tools show more per screen |

## Type and text

| Tell | Fix |
| --- | --- |
| Emoji in headings, buttons, menus, toasts ("🚀 Get started", "✨ AI") | Words. Icons from the project's icon set if needed |
| "Welcome back, John! 👋" as the page title | The page name ("Dashboard"), with the date or a short status if useful |
| Marketing words in the app: "seamless", "effortless", "powerful", "unlock", "supercharge" | Plain words that say what happens |
| Title Case On Every Label | Sentence case |
| Bold text everywhere, or every heading the same size | 2 or 3 weights, a clear scale |
| All text the same grey | Strong for titles and values, `muted` for labels and helper text |
| Lorem ipsum, "John Doe", "Acme Inc", "Item 1" | Domain words and believable data (`frontend-api/references/mock-data.md`) |

## Components

| Tell | Fix |
| --- | --- |
| Default Lucide outline icons in the menu | Phosphor duotone (layout spec), or one other chosen set |
| Primary color buttons everywhere | One primary per screen. Others secondary, ghost, or in a menu |
| Badges in many bright colors | Subtle tinted badges, status colors only |
| Empty state: big grey icon, "No data found" | Says what will be here, why it is empty, and the action that fills it |
| Spinner in the middle of the page | Skeleton in the shape of the content |
| Avatars all the same grey circle | Initials on a tint picked from the name, from a fixed small palette |
| Tables with zebra stripes, heavy header color and borders on every cell | Lines between rows only, a quiet header, numbers right-aligned |
| Toggle, checkbox and radio in different styles on one page | All from the shared fields |
| Hover effects that scale or lift cards (`hover:scale-105`, `-translate-y-1`) | Change the background or the border. Nothing moves |

## Motion

| Tell | Fix |
| --- | --- |
| Everything fades and slides in on load | Motion only for state changes: open, close, add, remove |
| Bouncy springs, long 500 ms transitions | 120 to 200 ms, `ease-out`, `transform` and `opacity` only |
| Animated gradient borders, shimmer on buttons | None |

## Quick test

Hide the logo and the name. Could the screen belong to any product? If yes,
check that the brand color, the font, the radius and the content are actually
the project's.
