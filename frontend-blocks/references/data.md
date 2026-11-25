# Data blocks

## Charts

```tsx
const series: ChartSeries[] = [{ key: 'online', label: 'Online', color: 1 }, { key: 'shop', label: 'Shop', color: 2 }];
<LineChart title="Revenue" labelHeading="Month" data={rows} series={series} formatValue={money}
  isLoading={q.isPending} isFetching={q.isPlaceholderData} error={message} onRetry={q.refetch} />
// rows: [{ label: 'Jan', values: { online: 1200, shop: 800 } }]
```

| Question | Use |
| --- | --- |
| change over time | `LineChart`; `area` for one series |
| compare amounts | `BarChart`; `stacked` when the parts make a whole |
| shares, up to six | `DonutChart` |
| ranking, long names | `RankChart` |
| one number | `StatCard`, with `Sparkline` inside if useful |

- Give each series a fixed `color`; filtering must not repaint the others.
- Up to four series; more: "Other", or several small charts.
- One y-axis. Two measures with different units are two charts.
- `null` is "no value" and leaves a gap; `0` is zero.
- Filters stand above all charts they change, never inside one.
- Built in: tooltip, arrow keys, legend, table view, empty and error. Do not remove.
- Other brand colors: change `charts.css`, and check them for color blindness.
- Maps, heat maps, zoom, thousands of points: a library, loaded with `LazySection`.

## Sortable list and kanban

```tsx
<SortableList label="Steps" items={steps} getId={getId} getName={getName} renderItem={draw}
  onReorder={(next) => save.mutate(next)} />

<KanbanBoard label="Tasks" columns={columns} cards={tasks.data} getId={getId} getName={getTitle}
  getColumn={getStatus} renderCard={draw} onMove={move} />

onMutate: (m) => {
  const before = client.getQueryData<Task[]>(key);
  client.setQueryData<Task[]>(key, (old = []) => applyKanbanMove(old, m, getId, getStatus, (t, status) => ({ ...t, status })));
  return before;
},
onError: (_e, _m, before) => client.setQueryData(key, before),
```

Send the server the id, the column and the neighbour or position, not the whole
list. Keyboard: Space picks up, arrows move, Space drops, Escape cancels. Above about
100 cards in a column, load them in parts.

## Calendar

```tsx
<EventCalendar label="Bookings" events={q.data} month={month} isLoading={q.isFetching}
  onMonthChange={(next, range) => setRange({ month: next, ...range })} onOpenEvent={open} onSelectDay={create} />
```

Days are `YYYY-MM-DD` in the person's time zone; convert times before. `range`
includes the days around the month. No day or week view with hours, no dragging of
events.

## CSV import

```tsx
<CsvImport columns={[{ key: 'email', label: 'Email', required: true, unique: true, aliases: ['mail'], validate: checkEmail }]}
  toRecord={(c) => ({ email: c.email.toLowerCase() })} onImport={importUsers} onDone={close} templateName="users" />
```

`columns` and `toRecord` outside the component. `onImport` sends groups of about 200,
reports progress, stops on `signal`, and returns the refused lines. The server checks
again. Very large files: upload the file and let the server import it. Excel: save
as CSV.

## Infinite list

`InfiniteList` with `useInfiniteQuery`; pages are `{ items, nextCursor, total? }`.
`getKey` and `renderItem` outside the component. Needs a height.
