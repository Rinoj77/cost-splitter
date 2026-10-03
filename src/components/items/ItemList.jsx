import { useMemo, useState } from "react";
import { ItemRow } from "./ItemRow";
import { TripCard } from "../trips/TripCard";
import { Tag } from "../ui/Tag";
import { tripSortTime } from "../../lib/format";
import { matchesSearch } from "../../lib/search";
import { SERIF } from "../../lib/styles";

export function ItemList({ items, trips, names, onUpdateItem, onDeleteItem, onUpdateTrip, onDeleteTrip, onAddItem }) {
  const [search, setSearch] = useState("");
  const q = search.trim();

  // Group trip items by trip id in one pass instead of filtering the full list per trip.
  const { soloItems, tripItemsById } = useMemo(() => {
    const solo = [];
    const byTrip = new Map();
    for (const item of items) {
      if (!item.groupId) solo.push(item);
      else if (byTrip.has(item.groupId)) byTrip.get(item.groupId).push(item);
      else byTrip.set(item.groupId, [item]);
    }
    return { soloItems: solo, tripItemsById: byTrip };
  }, [items]);

  const entries = useMemo(() => {
    const result = [];
    for (const trip of trips) {
      const tripItems = tripItemsById.get(trip.id) ?? [];
      const tripNameMatches = !q || matchesSearch(trip.name, q);
      const matchedItems = q ? tripItems.filter(i => matchesSearch(i.name, q)) : tripItems;
      if (tripNameMatches || matchedItems.length > 0) {
        // Cards always get the full item list; matchedItemIds only marks which items hit the search.
        const matchedItemIds = q && !tripNameMatches ? new Set(matchedItems.map(i => i.id)) : null;
        result.push({ type: "trip", id: trip.id, sortTime: tripSortTime(trip), createdAt: trip.createdAt, trip, tripItems, matchedItemIds });
      }
    }
    for (const item of soloItems) {
      if (!q || matchesSearch(item.name, q)) result.push({ type: "item", id: item.id, sortTime: item.createdAt, createdAt: item.createdAt, item });
    }
    return result.sort((a, b) => b.sortTime - a.sortTime || b.createdAt - a.createdAt);
  }, [trips, tripItemsById, soloItems, q]);

  const hasContent = items.length > 0 || trips.length > 0;
  const totalCost = useMemo(() => items.reduce((s, i) => s + i.cost, 0), [items]);

  return (
    <div>
      <div className="relative mb-4">
        <label htmlFor="item-list-search" className="sr-only">Search items by name</label>
        <input id="item-list-search" type="text" role="searchbox" autoComplete="off"
          placeholder="Search items or trips…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-3 pr-10 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" />
        {search.length > 0 && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/80 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-stone-800" style={SERIF}>Items</h2>
        {hasContent && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {q ? (
              <Tag color="stone">{entries.length} result{entries.length !== 1 ? "s" : ""}</Tag>
            ) : (
              <>
                <Tag color="stone">{trips.length} trip{trips.length !== 1 ? "s" : ""}</Tag>
                <Tag color="stone">{soloItems.length} solo item{soloItems.length !== 1 ? "s" : ""}</Tag>
                <Tag color="stone">€{totalCost.toFixed(2)} total</Tag>
              </>
            )}
          </div>
        )}
      </div>

      {!hasContent ? (
        <div className="text-center py-16 text-stone-300 border border-dashed border-stone-200 rounded-2xl">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-mono text-sm">No items yet. Add one above.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-14 text-stone-400 border border-dashed border-stone-200 rounded-2xl bg-white/50">
          <p className="font-mono text-sm mb-1">No items match &ldquo;{q}&rdquo;</p>
          <p className="text-xs text-stone-400">Try another name or clear the search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(entry =>
            entry.type === "trip" ? (
              <TripCard key={entry.id} trip={entry.trip} tripItems={entry.tripItems} matchedItemIds={entry.matchedItemIds} names={names}
                onUpdateTrip={onUpdateTrip} onDeleteTrip={onDeleteTrip}
                onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem} onAddItem={onAddItem} />
            ) : (
              <ItemRow key={entry.id} item={entry.item} names={names}
                onSave={onUpdateItem} onDelete={onDeleteItem} />
            )
          )}
        </div>
      )}
    </div>
  );
}
