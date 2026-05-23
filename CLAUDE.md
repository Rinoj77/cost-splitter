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

Single-page React app with no routing and no external state library. Everything lives in `src/App.jsx` — one file, ~690 lines.

**Data model** — each item in the list has this shape:
```js
{ id: number, name: string, cost: number, shareA: number, shareB: number, paidBy: "a" | "b" }
```
Two users are always referred to internally as `"a"` and `"b"`. Display names are stored separately in `names: { a: string, b: string }`.

**Persistence** — two `localStorage` keys:
- `splittab_items` — the item array
- `splittab_names` — the `{ a, b }` names object

Both are loaded as `useState` initializers and synced back via `useEffect`.

**Ledger calculation** (`computeBalances`) — pure function over the item array. For each item: `net = paid - consumed`, where consumed = `cost × share%`. The settlement message derives from whichever user has a negative net (they owe the other).

**Component tree:**
```
App                        ← root state (items, names, editingItem)
├── NetBalanceSummary      ← calls computeBalances, read-only display
├── ItemForm               ← controlled form; both add and edit modes
│   └── PaidToggle         ← animated toggle, mutually exclusive between A and B
└── ItemList               ← search + filtered list
    └── ItemRow (×n)       ← displays one item with breakdown; edit/delete actions
        └── PaidIndicator  ← static (read-only) version of PaidToggle
```

`EditableName` is a small inline-edit component used in the header for renaming users.

**Styling** — Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js` needed). Fonts (DM Serif Display, DM Mono, DM Sans) are loaded from Google Fonts inline in JSX. Color palette is stone/amber/emerald/rose.

**Deployment** — Vercel. Production site: https://cost-splitter-psi.vercel.app/
