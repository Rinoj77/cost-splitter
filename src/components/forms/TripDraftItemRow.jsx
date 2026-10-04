import { PaidIndicator } from "../ui/PaidIndicator";
import { ShareCell } from "../ui/ShareCell";
import { handleShareChange } from "../../lib/items";
import { ITEM_COLS_DEL } from "../../lib/styles";

// Editable row for an item already added to an unsaved trip (Add Trip tab). Same look as the
// ghost row; `invalid` adds a red outline. paidBy is locked to the trip, so it's an indicator.
export function TripDraftItemRow({ fields, paidBy, invalid, onChange, onRemove }) {
  // Apply both share fields in one onChange so neither update clobbers the other.
  function changeShares(value, self, other) {
    const next = { ...fields };
    handleShareChange(value, v => { next[self] = v; }, v => { next[other] = v; });
    onChange(next);
  }

  return (
    <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center px-3 py-2 rounded-xl border ${invalid ? "border-rose-300 bg-rose-50/60" : "border-stone-200 bg-white"}`}>
      <input type="text" placeholder="Item name…" value={fields.name} aria-label="Item name"
        onChange={e => onChange({ ...fields, name: e.target.value })}
        className="bg-transparent border-none outline-none text-sm text-stone-800 placeholder-stone-300 w-full" />
      <input type="number" placeholder="0.00" min="0" step="0.01" value={fields.cost} aria-label="Cost"
        onChange={e => onChange({ ...fields, cost: e.target.value })}
        className="bg-transparent border-none outline-none text-sm font-mono text-stone-800 text-right w-full placeholder-stone-300" />
      <ShareCell variant="ghost" value={fields.shareA} onChange={v => changeShares(v, "shareA", "shareB")} />
      <div className="flex justify-center"><PaidIndicator checked={paidBy === "a"} /></div>
      <ShareCell variant="ghost" value={fields.shareB} onChange={v => changeShares(v, "shareB", "shareA")} />
      <div className="flex justify-center"><PaidIndicator checked={paidBy === "b"} /></div>
      <button type="button" onClick={onRemove} aria-label="Remove item"
        className="text-xs font-mono text-stone-300 hover:text-rose-400 transition-colors text-center">✕</button>
    </div>
  );
}
