import { useState } from "react";
import { ReadOnlyItem } from "./ReadOnlyItem";
import { SharesFooter } from "./SharesFooter";
import { ItemColHeaders } from "../ui/ColHeaders";
import { PaidToggle } from "../ui/PaidToggle";
import { ShareCell } from "../ui/ShareCell";
import { handleShareChange, shareTotal, validateItem } from "../../lib/items";
import { itemShares, totalIs100 } from "../../lib/ledger";
import { ITEM_COLS_DEL, inputAmber } from "../../lib/styles";

export function ItemRow({ item, names, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  function startEdit() {
    setForm({ name: item.name, cost: String(item.cost), shareA: String(item.shareA), shareB: String(item.shareB), paidBy: item.paidBy });
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setForm(null); }

  const validated = form ? validateItem(form, form.paidBy) : null;
  function saveEdit() {
    if (!validated) return;
    onSave({ ...item, ...validated });
    setEditing(false); setForm(null);
  }

  if (editing && form) {
    const total = shareTotal(form.shareA, form.shareB);
    const sharesValid = totalIs100(total);
    const shares = itemShares(parseFloat(form.cost), parseFloat(form.shareA), parseFloat(form.shareB));
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-1"><ItemColHeaders names={names} /></div>
        <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center px-4 pb-3`}>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputAmber} />
          <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className={`${inputAmber} font-mono text-right`} />
          <ShareCell variant="amber" value={form.shareA}
            onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareA: s })), s => setForm(f => ({ ...f, shareB: s })))} />
          <div className="flex justify-center">
            <PaidToggle checked={form.paidBy === "a"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "a" ? null : "a" }))} />
          </div>
          <ShareCell variant="amber" value={form.shareB}
            onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareB: s })), s => setForm(f => ({ ...f, shareA: s })))} />
          <div className="flex justify-center">
            <PaidToggle checked={form.paidBy === "b"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "b" ? null : "b" }))} />
          </div>
          <div />
        </div>
        {!sharesValid && (form.shareA !== "" || form.shareB !== "") && (
          <p className="text-xs text-rose-500 font-mono px-4 pb-2">⚠ Shares must add up to 100% (currently {total}%)</p>
        )}
        <SharesFooter names={names} shareA={shares.a} shareB={shares.b} tone="amber">
          <button onClick={saveEdit} disabled={!validated}
            className={`text-xs font-mono px-2 py-1 rounded w-full text-center transition-colors ${validated ? "text-amber-700 hover:bg-amber-100 cursor-pointer" : "text-stone-300 cursor-not-allowed"}`}>
            ✓ Save
          </button>
          <button onClick={cancelEdit}
            className="text-xs font-mono text-stone-400 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100 w-full text-center">
            ✕ Cancel
          </button>
        </SharesFooter>
      </div>
    );
  }

  return (
    <ReadOnlyItem item={item} names={names} actions={
      <>
        <button onClick={startEdit}
          className="text-xs font-mono text-stone-400 hover:text-amber-600 transition-colors px-2 py-1 rounded hover:bg-amber-50 w-full text-center">
          ✎ Edit
        </button>
        <button onClick={() => onDelete(item.id)}
          className="text-xs font-mono text-stone-400 hover:text-rose-500 transition-colors px-2 py-1 rounded hover:bg-rose-50 w-full text-center">
          ✕ Delete
        </button>
      </>
    } />
  );
}
