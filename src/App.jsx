import { useState } from "react";
import { LS_ITEMS, LS_NAMES, LS_TRIPS, loadItems, loadNames, loadTrips } from "./lib/storage";
import { SERIF } from "./lib/styles";
import { newRecordMeta } from "./lib/items";
import { useStoredState } from "./hooks/useStoredState";
import { ConfirmPopup } from "./components/ui/ConfirmPopup";
import { EditableName } from "./components/ui/EditableName";
import { NetBalanceSummary } from "./components/NetBalanceSummary";
import { FormTabContainer } from "./components/forms/FormTabContainer";
import { ItemList } from "./components/items/ItemList";

export default function App() {
  const [items, setItems] = useStoredState(LS_ITEMS, loadItems);
  const [trips, setTrips] = useStoredState(LS_TRIPS, loadTrips);
  const [names, setNames] = useStoredState(LS_NAMES, loadNames);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  function handleSaveItem(item) { setItems(prev => [item, ...prev]); }

  function handleSaveTrip(draft) {
    const tripMeta = newRecordMeta();
    setTrips(prev => [{ ...tripMeta, name: draft.name.trim(), date: draft.date, paidBy: draft.paidBy }, ...prev]);
    setItems(prev => [...draft.items.map(item => ({ ...item, groupId: tripMeta.id })), ...prev]);
  }

  function handleUpdateItem(updated) { setItems(prev => prev.map(i => i.id === updated.id ? updated : i)); }
  function handleDeleteItem(id) { setItems(prev => prev.filter(i => i.id !== id)); }
  function handleUpdateTrip(updated) { setTrips(prev => prev.map(t => t.id === updated.id ? updated : t)); }
  function handleDeleteTrip(tripId) {
    setTrips(prev => prev.filter(t => t.id !== tripId));
    setItems(prev => prev.filter(i => i.groupId !== tripId));
  }
  function handleAddItem(item) { setItems(prev => [...prev, item]); }

  function handleClearAll() {
    setItems([]); setTrips([]);
    setShowClearConfirm(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f7f4ef 0%, #ede9e2 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      {showClearConfirm && (
        <ConfirmPopup message="Start fresh? This will clear all items and trips for the new week."
          confirmLabel="Clear all" onConfirm={handleClearAll} onCancel={() => setShowClearConfirm(false)} />
      )}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="mb-8">
          <div className="flex items-end justify-between">
            <h1 className="text-4xl text-stone-900 leading-none" style={SERIF}>
              Cost Splitter
            </h1>
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <EditableName value={names.a} onChange={name => setNames(n => ({ ...n, a: name }))} />
              <span className="text-xs text-stone-300 font-mono">&</span>
              <EditableName value={names.b} onChange={name => setNames(n => ({ ...n, b: name }))} />
            </div>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-stone-300 via-stone-200 to-transparent" />
        </header>

        <NetBalanceSummary items={items} names={names} onClearAll={() => setShowClearConfirm(true)} />
        <FormTabContainer names={names} onSaveItem={handleSaveItem} onSaveTrip={handleSaveTrip} />
        <ItemList items={items} trips={trips} names={names}
          onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem}
          onUpdateTrip={handleUpdateTrip} onDeleteTrip={handleDeleteTrip}
          onAddItem={handleAddItem} />
      </div>
    </div>
  );
}
