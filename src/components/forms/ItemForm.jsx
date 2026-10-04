import { useState } from "react";
import { TripItemGhostRow } from "./TripItemGhostRow";
import { ItemColHeaders } from "../ui/ColHeaders";
import { PaidIndicator } from "../ui/PaidIndicator";
import { PaidToggle } from "../ui/PaidToggle";
import { ShareCell } from "../ui/ShareCell";
import { SplitPresets } from "../ui/SplitPresets";
import { handleShareChange, newRecordMeta, shareTotal, validateItem } from "../../lib/items";
import { totalIs100 } from "../../lib/ledger";
import { ITEM_COLS_DEL, inputBase } from "../../lib/styles";

const EMPTY_FORM = { name: "", cost: "", shareA: "", shareB: "", paidBy: null };

export function ItemForm({ names, autoFocus = false, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const total = shareTotal(form.shareA, form.shareB);
  const sharesValid = totalIs100(total);
  const hasShareInput = form.shareA !== "" || form.shareB !== "";
  const validated = validateItem(form, form.paidBy);
  const canSubmit = validated !== null;

  function onSubmit() {
    if (!validated) return;
    onSave({ ...newRecordMeta(), ...validated });
    setForm(EMPTY_FORM);
  }

  return (
    <div>
      <div className="mb-1"><ItemColHeaders names={names} /></div>
      <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center`}>
        <input type="text" placeholder="e.g. Pasta, Shampoo…" value={form.name} autoFocus={autoFocus}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputBase} />
        <input type="number" placeholder="0.00" min="0" step="0.01" value={form.cost}
          onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className={`${inputBase} font-mono text-right`} />
        <ShareCell value={form.shareA}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareA: s })), s => setForm(f => ({ ...f, shareB: s })))} />
        <div className="flex justify-center">
          <PaidToggle checked={form.paidBy === "a"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "a" ? null : "a" }))} />
        </div>
        <ShareCell value={form.shareB}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareB: s })), s => setForm(f => ({ ...f, shareA: s })))} />
        <div className="flex justify-center">
          <PaidToggle checked={form.paidBy === "b"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "b" ? null : "b" }))} />
        </div>
        <div />
      </div>
      <SplitPresets names={names} shareA={form.shareA} shareB={form.shareB} className="mt-2"
        onPick={(shareA, shareB) => setForm(f => ({ ...f, shareA, shareB }))} />
      {hasShareInput && !sharesValid && (
        <p className="text-xs text-rose-500 font-mono mt-2">⚠ Shares must add up to exactly 100% (currently {total}%)</p>
      )}
      <div className="flex justify-end pt-3">
        <button onClick={onSubmit} disabled={!canSubmit}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${canSubmit ? "bg-stone-900 text-white hover:bg-stone-700 active:scale-95 shadow-sm cursor-pointer" : "bg-stone-100 text-stone-400 cursor-not-allowed"}`}>
          + Add to list
        </button>
      </div>
    </div>
  );
}

// ─── TripItemGhostRow ──────────────────────────────────────────────────────────
// Active input row + ghost "Add another item" row below.
// paidBy is locked to the trip level — shown as PaidIndicator, not a toggle.

// Controlled: the parent owns `form` so it can include a pending item on Save,
// warn about it as unsaved data, and keep it when the trip payer changes.
