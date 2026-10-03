import { useState } from "react";
import { TripItemGhostRow } from "../forms/TripItemGhostRow";
import { ReadOnlyItem } from "../items/ReadOnlyItem";
import { SharesFooter } from "../items/SharesFooter";
import { TripItemEditRow } from "./TripItemEditRow";
import { TripMetaColHeaders } from "../ui/ColHeaders";
import { ConfirmPopup } from "../ui/ConfirmPopup";
import { PaidIndicator } from "../ui/PaidIndicator";
import { PaidToggle } from "../ui/PaidToggle";
import { formatDate } from "../../lib/format";
import { EMPTY_GHOST_FORM, hasGhostInput, newRecordMeta, validateItem } from "../../lib/items";
import { computeTripShares } from "../../lib/ledger";
import { SERIF, TRIP_COLS_ACC, inputAmber } from "../../lib/styles";

export function TripCard({ trip, tripItems, matchedItemIds, names, onUpdateTrip, onDeleteTrip, onUpdateItem, onDeleteItem, onAddItem }) {
  const [expandedByUser, setExpanded] = useState(false);
  // While a search matches only some of this trip's items, stay open so the matches are visible.
  const expanded = expandedByUser || matchedItemIds != null;
  const [isEditing, setIsEditing] = useState(false);
  const [tripDraft, setTripDraft] = useState(null);
  const [itemDrafts, setItemDrafts] = useState({});
  // Edit-mode changes to the item set are held here and only applied on Save.
  const [deletedIds, setDeletedIds] = useState([]);
  const [newItemIds, setNewItemIds] = useState([]);
  const [ghostForm, setGhostForm] = useState(EMPTY_GHOST_FORM);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { shareA, shareB } = computeTripShares(tripItems);
  // A complete ghost-row item is added on Save; a half-filled one blocks Save.
  const pendingItem = validateItem(ghostForm, tripDraft?.paidBy ?? null);
  const hasBlockingPending = hasGhostInput(ghostForm) && !pendingItem;
  const allItemDraftsValid = Object.values(itemDrafts).every(d => validateItem(d, tripDraft?.paidBy) !== null);
  const editItems = [
    ...tripItems.filter(i => !deletedIds.includes(i.id)),
    ...newItemIds.map(id => ({ id })),
  ];

  function resetEditState() {
    setIsEditing(false); setTripDraft(null); setItemDrafts({});
    setDeletedIds([]); setNewItemIds([]); setGhostForm(EMPTY_GHOST_FORM);
  }

  function startEdit() {
    setTripDraft({ name: trip.name, date: trip.date, paidBy: trip.paidBy });
    const drafts = {};
    for (const item of tripItems) {
      drafts[item.id] = { name: item.name, cost: String(item.cost), shareA: String(item.shareA), shareB: String(item.shareB) };
    }
    setItemDrafts(drafts);
    setExpanded(true);
    setIsEditing(true);
  }

  function cancelEdit() { resetEditState(); }

  function saveEdit() {
    if (!tripDraft?.name.trim() || !tripDraft.date || !tripDraft.paidBy || hasBlockingPending) return;
    if (!allItemDraftsValid) return;
    onUpdateTrip({ ...trip, name: tripDraft.name.trim(), date: tripDraft.date, paidBy: tripDraft.paidBy });
    const toItem = (base, d) => ({ ...base, ...validateItem(d, tripDraft.paidBy) });
    for (const item of tripItems) {
      if (deletedIds.includes(item.id)) onDeleteItem(item.id);
      else if (itemDrafts[item.id]) onUpdateItem(toItem(item, itemDrafts[item.id]));
    }
    for (const id of newItemIds) {
      onAddItem(toItem({ id, createdAt: Date.now(), groupId: trip.id }, itemDrafts[id]));
    }
    if (pendingItem) onAddItem({ ...newRecordMeta(), groupId: trip.id, ...pendingItem });
    resetEditState();
  }

  function addItemInEdit(item) {
    setItemDrafts(prev => ({
      ...prev,
      [item.id]: { name: item.name, cost: String(item.cost), shareA: String(item.shareA), shareB: String(item.shareB) },
    }));
    setNewItemIds(prev => [...prev, item.id]);
  }

  function updateItemDraft(id, draft) {
    setItemDrafts(prev => ({ ...prev, [id]: draft }));
  }

  function deleteItemInEdit(id) {
    setItemDrafts(prev => { const next = { ...prev }; delete next[id]; return next; });
    if (newItemIds.includes(id)) setNewItemIds(prev => prev.filter(n => n !== id));
    else setDeletedIds(prev => [...prev, id]);
  }

  function setTripDraftPaidBy(person) {
    setTripDraft(d => ({ ...d, paidBy: d.paidBy === person ? null : person }));
  }

  const canSaveEdit = tripDraft?.name.trim() && tripDraft?.date && tripDraft?.paidBy && allItemDraftsValid && !hasBlockingPending;

  // ── Row 1: trip details / editable ──
  const row1 = isEditing && tripDraft ? (
    <div className={`grid ${TRIP_COLS_ACC} gap-3 items-center px-4 py-3 border-b border-stone-100`}>
      <input type="text" value={tripDraft.name}
        onChange={e => setTripDraft(d => ({ ...d, name: e.target.value }))}
        className={`${inputAmber} font-medium`}
        style={SERIF} />
      <input type="date" value={tripDraft.date}
        onChange={e => setTripDraft(d => ({ ...d, date: e.target.value }))}
        className="bg-white border border-amber-300 rounded-md px-2 py-2 text-sm font-mono text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-400 transition" />
      <div className="flex justify-center">
        <PaidToggle checked={tripDraft.paidBy === "a"} onToggle={() => setTripDraftPaidBy("a")} />
      </div>
      <div className="flex justify-center">
        <PaidToggle checked={tripDraft.paidBy === "b"} onToggle={() => setTripDraftPaidBy("b")} />
      </div>
      <button onClick={() => setExpanded(e => !e)} className="text-stone-400 hover:text-stone-600 transition-colors text-sm">
        {expanded ? "▼" : "▶"}
      </button>
    </div>
  ) : (
    <div className={`grid ${TRIP_COLS_ACC} gap-3 items-center px-4 py-3 border-b border-stone-100`}>
      <span className="text-stone-800 font-medium" style={SERIF}>{trip.name}</span>
      <span className="font-mono text-sm text-stone-500">{formatDate(trip.date)}</span>
      <div className="flex justify-center"><PaidIndicator checked={trip.paidBy === "a"} /></div>
      <div className="flex justify-center"><PaidIndicator checked={trip.paidBy === "b"} /></div>
      <button onClick={() => setExpanded(e => !e)} className="text-stone-400 hover:text-stone-600 transition-colors text-sm">
        {expanded ? "▼" : "▶"}
      </button>
    </div>
  );

  // ── Row 2: shares + actions ──
  const row2 = (
    <SharesFooter names={names} shareA={shareA} shareB={shareB}>
      {isEditing ? (
        <>
          <button onClick={saveEdit} disabled={!canSaveEdit}
            className={`text-xs font-mono px-2 py-1 rounded w-full text-center transition-colors ${canSaveEdit ? "text-amber-700 hover:bg-amber-100 cursor-pointer" : "text-stone-300 cursor-not-allowed"}`}>
            ✓ Save
          </button>
          <button onClick={cancelEdit}
            className="text-xs font-mono text-stone-400 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100 w-full text-center">
            ✕ Cancel
          </button>
        </>
      ) : (
        <>
          <button onClick={startEdit}
            className="text-xs font-mono text-stone-400 hover:text-amber-600 transition-colors px-2 py-1 rounded hover:bg-amber-50 w-full text-center">
            ✎ Edit Trip
          </button>
          <button onClick={() => setShowDeleteConfirm(true)}
            className="text-xs font-mono text-stone-400 hover:text-rose-500 transition-colors px-2 py-1 rounded hover:bg-rose-50 w-full text-center">
            ✕ Delete Trip
          </button>
        </>
      )}
    </SharesFooter>
  );

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
      {showDeleteConfirm && (
        <ConfirmPopup
          message={`Delete "${trip.name}" and all ${tripItems.length} item${tripItems.length !== 1 ? "s" : ""} in it? This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => { onDeleteTrip(trip.id); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Column headers */}
      <div className="px-4 pt-3 pb-1">
        <TripMetaColHeaders names={names} withAccordion />
      </div>

      {row1}
      {row2}

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 bg-stone-50/40">
          {(isEditing ? editItems : tripItems).length > 0 ? (
            <div className="flex flex-col gap-2">
              {(isEditing ? editItems : tripItems).map(item =>
                isEditing ? (
                  <TripItemEditRow
                    key={item.id}
                    item={item}
                    names={names}
                    paidBy={tripDraft?.paidBy ?? trip.paidBy}
                    draft={itemDrafts[item.id]}
                    onChange={d => updateItemDraft(item.id, d)}
                    onDelete={deleteItemInEdit}
                  />
                ) : (
                  <ReadOnlyItem key={item.id} item={item} names={names} nested
                    dimmed={matchedItemIds != null && !matchedItemIds.has(item.id)} />
                )
              )}
            </div>
          ) : (
            <p className="text-xs font-mono text-stone-400 text-center py-2">No items in this trip yet.</p>
          )}

          {/* Ghost row — only in edit mode */}
          {isEditing && (
            <div className="mt-3">
              <p className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-2">Add Item to Trip</p>
              <TripItemGhostRow
                paidBy={tripDraft?.paidBy ?? trip.paidBy}
                form={ghostForm}
                setForm={setGhostForm}
                onCommit={addItemInEdit}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
