import { useState, useEffect, useRef } from "react";
import { TripItemGhostRow } from "./TripItemGhostRow";
import { ItemDisplayRow } from "../items/ItemDisplayRow";
import { ItemColHeaders, TripMetaColHeaders } from "../ui/ColHeaders";
import { ConfirmPopup } from "../ui/ConfirmPopup";
import { PaidToggle } from "../ui/PaidToggle";
import { todayISO } from "../../lib/format";
import { EMPTY_GHOST_FORM, hasGhostInput, newRecordMeta, validateItem } from "../../lib/items";
import { TRIP_COLS, inputBase } from "../../lib/styles";

const newTripDraft = () => ({ name: "", date: todayISO(), paidBy: null, items: [] });

export function TripForm({ names, onSave, onDraftChange }) {
  const [draft, setDraft] = useState(newTripDraft);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [ghostForm, setGhostForm] = useState(EMPTY_GHOST_FORM);

  // A complete ghost-row item is included on Save; a half-filled one blocks Save.
  const pendingItem = validateItem(ghostForm, draft.paidBy);
  const hasPendingInput = hasGhostInput(ghostForm);
  const hasBlockingPending = hasPendingInput && !pendingItem;
  const itemCount = draft.items.length + (pendingItem ? 1 : 0);

  const hasDraftData = draft.name.trim() !== "" || draft.items.length > 0 || hasPendingInput;
  const canSave = draft.name.trim() && draft.date && draft.paidBy !== null && itemCount > 0 && !hasBlockingPending;

  const onDraftChangeRef = useRef(onDraftChange);
  useEffect(() => { onDraftChangeRef.current = onDraftChange; });
  useEffect(() => { onDraftChangeRef.current(hasDraftData); }, [hasDraftData]);

  function reset() {
    setDraft(newTripDraft());
    setGhostForm(EMPTY_GHOST_FORM);
    setShowResetConfirm(false);
  }

  function handleSave() {
    if (!canSave) return;
    const items = pendingItem ? [...draft.items, { ...newRecordMeta(), ...pendingItem }] : draft.items;
    onSave({ ...draft, items });
    setDraft(newTripDraft());
    setGhostForm(EMPTY_GHOST_FORM);
  }

  function addItem(item) { setDraft(d => ({ ...d, items: [...d.items, item] })); }
  function removeItem(id) { setDraft(d => ({ ...d, items: d.items.filter(i => i.id !== id) })); }

  function setTripPaidBy(person) {
    setDraft(d => ({
      ...d,
      paidBy: d.paidBy === person ? null : person,
      items: d.items.map(i => ({ ...i, paidBy: d.paidBy === person ? null : person })),
    }));
  }

  return (
    <div>
      {showResetConfirm && (
        <ConfirmPopup message="Reset this trip? All unsaved items will be lost." confirmLabel="Reset"
          onConfirm={reset} onCancel={() => setShowResetConfirm(false)} />
      )}

      {/* Trip meta — column headers */}
      <div className="mb-1"><TripMetaColHeaders names={names} /></div>

      {/* Trip meta — inputs */}
      <div className={`grid ${TRIP_COLS} gap-3 items-center mb-5`}>
        <input type="text" placeholder="e.g. Lidl Run, IKEA trip…" value={draft.name}
          onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} className={inputBase} />
        <input type="date" value={draft.date}
          onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} className={inputBase} />
        <div className="flex justify-center">
          <PaidToggle checked={draft.paidBy === "a"} onToggle={() => setTripPaidBy("a")} />
        </div>
        <div className="flex justify-center">
          <PaidToggle checked={draft.paidBy === "b"} onToggle={() => setTripPaidBy("b")} />
        </div>
      </div>

      {/* Items section */}
      <div className="border-t border-stone-100 pt-4">
        <p className="text-xs font-mono text-stone-400 uppercase tracking-widest mb-3">Items in this Trip</p>

        {/* Column headers — always visible */}
        <div className="mb-2 px-3"><ItemColHeaders names={names} /></div>

        {/* Committed items */}
        {draft.items.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            {draft.items.map(item => (
              <ItemDisplayRow key={item.id} item={item} compact
                className="px-3 py-2 bg-white rounded-xl border border-stone-100"
                action={
                  <button onClick={() => removeItem(item.id)}
                    className="text-xs font-mono text-stone-300 hover:text-rose-400 transition-colors text-center">✕</button>
                } />
            ))}
          </div>
        )}

        {/* Ghost input row */}
        <TripItemGhostRow paidBy={draft.paidBy} form={ghostForm} setForm={setGhostForm} onCommit={addItem} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-5 mt-1 border-t border-stone-100">
        <button onClick={() => hasDraftData && setShowResetConfirm(true)} disabled={!hasDraftData}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${hasDraftData ? "text-stone-600 border-stone-300 hover:border-rose-300 hover:text-rose-500 cursor-pointer" : "text-stone-300 border-stone-200 cursor-not-allowed"}`}>
          Reset
        </button>
        <div className="flex items-center gap-3">
          {!canSave && (
            <span className="text-xs font-mono text-stone-400">
              {!draft.name.trim() ? "Enter a trip name" : draft.paidBy === null ? "Select who paid" : hasBlockingPending ? "Finish or clear the pending item" : itemCount === 0 ? "Add at least one item" : ""}
            </span>
          )}
          <button onClick={handleSave} disabled={!canSave}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${canSave ? "bg-stone-900 text-white hover:bg-stone-700 active:scale-95 shadow-sm cursor-pointer" : "bg-stone-100 text-stone-400 cursor-not-allowed"}`}>
            Save Trip
          </button>
        </div>
      </div>
    </div>
  );
}
