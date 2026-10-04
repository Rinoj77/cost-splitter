import { SharesFooter } from "../items/SharesFooter";
import { ItemColHeaders } from "../ui/ColHeaders";
import { PaidIndicator } from "../ui/PaidIndicator";
import { ShareCell } from "../ui/ShareCell";
import { handleShareChange, shareTotal, validateItem } from "../../lib/items";
import { itemShares, totalIs100 } from "../../lib/ledger";
import { ITEM_COLS_DEL, inputAmber } from "../../lib/styles";

export function TripItemEditRow({ item, names, paidBy, draft, onChange, onDelete }) {
  const total = shareTotal(draft.shareA, draft.shareB);
  const sharesValid = totalIs100(total);
  const { a: costA, b: costB } = itemShares(parseFloat(draft.cost), parseFloat(draft.shareA), parseFloat(draft.shareB));

  // Same red outline as invalid rows in the Add Trip tab; paidBy comes from the trip, so any payer works here.
  const invalid = validateItem(draft, "a") === null;

  // Apply both share fields in one onChange so neither update clobbers the other.
  function changeShares(value, self, other) {
    const next = { ...draft };
    handleShareChange(value, v => { next[self] = v; }, v => { next[other] = v; });
    onChange(next);
  }

  return (
    <div className={`border rounded-xl overflow-hidden ${invalid ? "bg-rose-50/60 border-rose-300" : "bg-amber-50 border-amber-200"}`}>
      <div className="px-4 pt-3 pb-1"><ItemColHeaders names={names} /></div>
      <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center px-4 pb-3`}>
        <input type="text" value={draft.name}
          onChange={e => onChange({ ...draft, name: e.target.value })}
          className={inputAmber} />
        <input type="number" min="0" step="0.01" value={draft.cost}
          onChange={e => onChange({ ...draft, cost: e.target.value })}
          className={`${inputAmber} font-mono text-right`} />
        <ShareCell variant="amber" value={draft.shareA} onChange={v => changeShares(v, "shareA", "shareB")} />
        {/* paidBy locked — show indicator, not toggle */}
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "a"} /></div>
        <ShareCell variant="amber" value={draft.shareB} onChange={v => changeShares(v, "shareB", "shareA")} />
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "b"} /></div>
        <button onClick={() => onDelete(item.id)}
          className="text-xs font-mono text-stone-300 hover:text-rose-400 transition-colors text-center">✕</button>
      </div>
      {!sharesValid && (draft.shareA !== "" || draft.shareB !== "") && (
        <p className="text-xs text-rose-500 font-mono px-4 pb-2">⚠ Shares must add up to 100% (currently {total}%)</p>
      )}
      <SharesFooter names={names} shareA={costA} shareB={costB} tone="amber" />
    </div>
  );
}
