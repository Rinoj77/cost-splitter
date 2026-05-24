# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build → dist/
npm run preview   # Serve the dist/ build locally
npm run lint      # ESLint (flat config, js/jsx files)
```

There are no tests in this project.

## Architecture

Single-page React app with no routing and no external state library. Everything lives in `src/App.jsx` — one file, ~1100 lines.

**Data model** — solo items have this shape:
```js
{ id: number, name: string, cost: number, shareA: number, shareB: number, paidBy: "a" | "b" }
```
Trip-grouped items carry an extra field:
```js
{ ...item, groupId: number }   // groupId links to a trip's id
```
Trips are stored separately:
```js
{ id: number, name: string, date: string, paidBy: "a" | "b" }
```
Two users are always referred to internally as `"a"` and `"b"`. Display names are stored separately in `names: { a: string, b: string }`.

**Persistence** — three `localStorage` keys:
- `splittab_items` — the item array (solo + trip-grouped items together)
- `splittab_names` — the `{ a, b }` names object
- `splittab_trips` — the trip array

All three are loaded as `useState` initializers and synced back via `useEffect`.

**Ledger calculation** — two pure helpers:
- `computeBalances(items)` — runs over the full item array (solo + grouped). For each item: `net = paid - consumed`, where consumed = `cost × share%`. Settlement message derives from whichever user has a negative net.
- `computeTripShares(tripItems)` — reduces a trip's items into `{ shareA, shareB }` monetary totals for display in the collapsed trip card.

**Grid template constants** — pixel-locked Tailwind grid strings defined at the top of the file and applied identically to column headers, display rows, and input rows so columns always align:
```js
const ITEM_COLS     = "grid-cols-[minmax(0,1fr)_110px_80px_70px_80px_70px]";
const ITEM_COLS_DEL = "grid-cols-[minmax(0,1fr)_110px_80px_70px_80px_70px_28px]";
const TRIP_COLS     = "grid-cols-[minmax(0,1fr)_160px_90px_90px]";
const TRIP_COLS_ACC = "grid-cols-[minmax(0,1fr)_160px_90px_90px_32px]";
```

**Component tree:**
```
App                          ← root state (items, trips, names)
├── NetBalanceSummary         ← calls computeBalances, read-only display
├── FormTabContainer          ← "Add Item" | "Add Trip" tabs; guards unsaved-trip navigation
│   ├── ItemForm              ← controlled form for solo items
│   │   └── PaidToggle        ← animated toggle, mutually exclusive A / B
│   └── TripForm              ← trip header + item ghost row; saves whole trip at once
│       ├── TripItemGhostRow  ← always-visible input row; "+ Add another item…" commits & resets
│       └── PaidIndicator     ← read-only toggle (paidBy locked to trip level)
└── ItemList                  ← search + filtered list; renders solo rows and trip cards
    ├── ItemRow (×n)          ← solo item, 2-row display; inline edit/delete
    │   └── PaidIndicator
    └── TripCard (×n)         ← collapsed 2-row card; expands accordion to show items
        ├── TripItemRow (×n)  ← read-only item row inside an expanded trip
        ├── TripItemEditRow   ← editable item row shown during Edit Trip mode
        └── TripItemGhostRow  ← ghost row shown at bottom only during Edit Trip mode
```

Shared column-header components (`ItemColHeaders`, `TripMetaColHeaders`) are rendered at the top of each card type so headers and data rows always use the same grid template.

`EditableName` is a small inline-edit component used in the header for renaming users.

**Trip editing** — "Edit Trip" enters a unified edit mode: the trip header and all its items become editable simultaneously via a `tripDraft` + `itemDrafts` map held in `TripCard` state. A single Save commits everything. A ghost row at the bottom lets you add new items during editing. `paidBy` is always locked to the trip-level toggle and shown as a read-only `PaidIndicator` inside item rows.

**Stable callback pattern** — `TripForm` uses a `useRef` wrapper for the `onDraftChange` callback to satisfy `react-hooks/exhaustive-deps` without re-running the effect on every render:
```js
const onDraftChangeRef = useRef(onDraftChange);
useEffect(() => { onDraftChangeRef.current = onDraftChange; });
useEffect(() => { onDraftChangeRef.current(hasDraftData); }, [hasDraftData]);
```

**Styling** — Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js` needed). Fonts (DM Serif Display, DM Mono, DM Sans) are loaded from Google Fonts inline in JSX. Color palette is stone/amber/emerald/rose.

**Deployment** — Vercel. Production site: https://cost-splitter-psi.vercel.app/
