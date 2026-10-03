import { useRef } from "react";
import { PaidIndicator } from "../ui/PaidIndicator";
import { ShareCell } from "../ui/ShareCell";
import { EMPTY_GHOST_FORM, handleShareChange, hasGhostInput, newRecordMeta, shareTotal, validateItem } from "../../lib/items";
import { totalIs100 } from "../../lib/ledger";
import { ITEM_COLS_DEL } from "../../lib/styles";

// Active input row + ghost "Add another item" row below. paidBy is locked to the trip
// level, so it is shown as a PaidIndicator, not a toggle.
// Controlled: the parent owns `form` so it can include a pending item on Save, warn
// about it as unsaved data, and keep it when the trip payer changes.
export function TripItemGhostRow({ paidBy, form, setForm, onCommit }) {
  const nameRef = useRef(null);

  const total = shareTotal(form.shareA, form.shareB);
  const sharesValid = totalIs100(total);
  const hasAnyInput = hasGhostInput(form);

  function commit() {
    const validated = validateItem(form, paidBy);
    if (!validated) {
      nameRef.current?.focus();
      return;
    }
    onCommit({ ...newRecordMeta(), ...validated });
    setForm(EMPTY_GHOST_FORM);
    nameRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Active input row */}
      <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center px-3 py-2 rounded-xl border bg-white ${hasAnyInput ? "border-stone-300" : "border-dashed border-stone-200"}`}>
        <input ref={nameRef} type="text" placeholder="Item name…" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && commit()}
          className="bg-transparent border-none outline-none text-sm text-stone-800 placeholder-stone-300 w-full" />
        <input type="number" placeholder="0.00" min="0" step="0.01" value={form.cost}
          onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
          className="bg-transparent border-none outline-none text-sm font-mono text-stone-800 text-right w-full placeholder-stone-300" />
        <ShareCell variant="ghost" value={form.shareA}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareA: s })), s => setForm(f => ({ ...f, shareB: s })))} />
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "a"} /></div>
        <ShareCell variant="ghost" value={form.shareB}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareB: s })), s => setForm(f => ({ ...f, shareA: s })))} />
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "b"} /></div>
        <div />
      </div>
      {hasAnyInput && !sharesValid && form.shareA !== "" && (
        <p className="text-xs text-rose-500 font-mono px-3">⚠ Shares must add up to 100% (currently {total}%)</p>
      )}
      {/* Ghost row */}
      <button onClick={commit}
        className="w-full px-3 py-2 text-left text-xs font-mono text-stone-400 hover:text-stone-600 hover:bg-stone-100/80 rounded-xl border border-dashed border-stone-200 transition-colors">
        + Add another item…
      </button>
    </div>
  );
}
