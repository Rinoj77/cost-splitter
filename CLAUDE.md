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

Single-page React app with no routing and no external state library. `src/App.jsx` is a thin root (state + handlers); logic lives in `src/lib/`, the persistence hook in `src/hooks/`, and one component per file under `src/components/`.

```
src/
├── App.jsx                       ← root: items / trips / names state and CRUD handlers
├── lib/
│   ├── storage.js                ← localStorage keys, validators, load/save, id migration
│   ├── ledger.js                 ← itemShares, computeBalances, computeTripShares, totalIs100
│   ├── items.js                  ← newRecordMeta, validateItem, shareTotal, handleShareChange, ghost-form helpers
│   ├── format.js                 ← formatDate, todayISO, tripSortTime
│   ├── search.js                 ← matchesSearch (fuzzy name match)
│   └── styles.js                 ← grid-column strings, input class strings, SERIF
├── hooks/useStoredState.js       ← useState that loads from / saves to localStorage
└── components/
    ├── NetBalanceSummary.jsx
    ├── ui/                       ← ConfirmPopup, Tag, PaidToggle, PaidIndicator, EditableName, ColHeaders, ShareCell
    ├── items/                    ← ItemDisplayRow, SharesFooter, ReadOnlyItem, ItemRow, ItemList
    ├── trips/                    ← TripCard, TripItemEditRow
    └── forms/                    ← ItemForm, TripItemGhostRow, TripForm, FormTabContainer
```

Component files export only components (the `react-refresh` lint rule); shared constants and helpers live in `lib/`.

**Data model** — solo items have this shape:
```js
{ id: string, createdAt: number, name: string, cost: number, shareA: number, shareB: number, paidBy: "a" | "b" }
```
Trip-grouped items carry an extra field:
```js
{ ...item, groupId: string }   // groupId links to a trip's id
```
Trips are stored separately:
```js
{ id: string, createdAt: number, name: string, date: string /* YYYY-MM-DD */, paidBy: "a" | "b" }
```
Ids come from `newRecordMeta()` (`crypto.randomUUID()` plus `createdAt`). Older saved data used numeric `Date.now()` ids; `migrateRecord` converts them to strings on load and uses the old id as `createdAt`.

Two users are always referred to internally as `"a"` and `"b"`. Display names are stored separately in `names: { a: string, b: string }`.

**Persistence** — three `localStorage` keys, exported from `lib/storage.js`:
- `splittab_items` — the item array (solo + trip-grouped items together)
- `splittab_names` — the `{ a, b }` names object
- `splittab_trips` — the trip array

`App` reads them with `useStoredState(key, loader)`, which loads once (via `loadStored`, which validates the shape and falls back to defaults on bad data) and writes back on every change (`saveStored` catches quota/private-mode errors and only logs a warning).

**Ledger calculation** — pure helpers in `lib/ledger.js`:
- `itemShares(cost, shareA, shareB)` — each person's share in euros, rounded to cents so the two shares always add up to the item cost.
- `computeBalances(items)` — runs over the full item array (solo + grouped). For each item: `net = paid - consumed`, using `itemShares`. Settlement derives from whichever user has a negative net.
- `computeTripShares(tripItems)` — sums `itemShares` into `{ shareA, shareB }` for the collapsed trip card.
- `totalIs100(total)` — share-sum check with a small float tolerance; use it instead of `=== 100`.

**Validation** — `validateItem(fields, paidBy)` in `lib/items.js` returns the cleaned item fields (trimmed name, numbers) or `null`. Every form and edit row uses it for its Save/Add button state.

**List order** — `ItemList` sorts trips by their date (end of that local day) and solo items by `createdAt`, newest first, with `createdAt` as the tie-break.

**Grid template constants** — pixel-locked Tailwind grid strings in `lib/styles.js`, applied identically to column headers, display rows, and input rows so columns always align. Header components (`ItemColHeaders`, `TripMetaColHeaders`) are grids themselves, so wrap them in a plain div, not another grid:
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
│       ├── TripItemGhostRow  ← controlled input row; "+ Add another item…" commits & resets
│       └── PaidIndicator     ← read-only toggle (paidBy locked to trip level)
└── ItemList                  ← search + list; renders solo rows and trip cards
    ├── ItemRow (×n)          ← solo item; read view is ReadOnlyItem, inline edit/delete
    └── TripCard (×n)         ← collapsed 2-row card; expands accordion to show items
        ├── ReadOnlyItem (nested, ×n) ← read-only item inside an expanded trip
        ├── TripItemEditRow   ← editable item row shown during Edit Trip mode
        └── TripItemGhostRow  ← ghost row shown at bottom only during Edit Trip mode
```

Shared building blocks: `ShareCell` (the "NN %" input), `ItemDisplayRow` (read-only item cells), `SharesFooter` (the two share boxes plus optional action buttons), and `ReadOnlyItem` (a full read-only item card; `nested` is the lighter style inside a trip).

`EditableName` is a small inline-edit component used in the header for renaming users.

**Trip editing** — "Edit Trip" enters a unified edit mode: the trip header and all its items become editable simultaneously via a `tripDraft` + `itemDrafts` map held in `TripCard` state. Deleted items (`deletedIds`) and newly added items (`newItemIds`) are also held in draft state, so nothing changes until the single Save, and Cancel discards everything. The ghost row at the bottom adds new items during editing; a complete pending ghost-row item is included on Save and a half-filled one blocks Save. `paidBy` is always locked to the trip-level toggle and shown as a read-only `PaidIndicator` inside item rows. `TripCard` always receives all of a trip's items; while a search matches only some of them, `matchedItemIds` marks the hits (the card stays open and the rest are dimmed).

**Stable callback pattern** — `TripForm` (`components/forms/TripForm.jsx`) uses a `useRef` wrapper for the `onDraftChange` callback to satisfy `react-hooks/exhaustive-deps` without re-running the effect on every render:
```js
const onDraftChangeRef = useRef(onDraftChange);
useEffect(() => { onDraftChangeRef.current = onDraftChange; });
useEffect(() => { onDraftChangeRef.current(hasDraftData); }, [hasDraftData]);
```

**Styling** — Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js` needed). Fonts (DM Serif Display, DM Mono, DM Sans) are loaded with a Google Fonts `@import` at the top of `src/index.css`. Color palette is stone/amber/emerald/rose.

**Deployment** — Vercel. Production site: https://cost-splitter-psi.vercel.app/
