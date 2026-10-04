import { useState } from "react";
import { LS_ITEMS, LS_NAMES, LS_ONBOARDED, LS_TRIPS, loadItems, loadNames, loadOnboarded, loadTrips } from "./lib/storage";
import { SERIF } from "./lib/styles";
import { newRecordMeta } from "./lib/items";
import { makeSampleData } from "./lib/sample";
import { useStoredState } from "./hooks/useStoredState";
import { ConfirmPopup } from "./components/ui/ConfirmPopup";
import { EditableName } from "./components/ui/EditableName";
import { WelcomeCard } from "./components/WelcomeCard";
import { DemoBanner } from "./components/DemoBanner";
import { NetBalanceSummary } from "./components/NetBalanceSummary";
import { FormTabContainer } from "./components/forms/FormTabContainer";
import { ItemList } from "./components/items/ItemList";

export default function App() {
  const [savedItems, setSavedItems] = useStoredState(LS_ITEMS, loadItems);
  const [savedTrips, setSavedTrips] = useStoredState(LS_TRIPS, loadTrips);
  const [savedNames, setSavedNames] = useStoredState(LS_NAMES, loadNames);
  const [onboarded, setOnboarded] = useStoredState(LS_ONBOARDED, loadOnboarded);
  // Sample { items, trips, names, fromSaved } while in demo mode; null otherwise. Never saved.
  const [demo, setDemo] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [focusItemForm, setFocusItemForm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Every handler below works on whichever data is showing: the demo copy or the saved data.
  const { items, trips, names } = demo ?? { items: savedItems, trips: savedTrips, names: savedNames };
  const setItems = fn => demo ? setDemo(d => ({ ...d, items: fn(d.items) })) : setSavedItems(fn);
  const setTrips = fn => demo ? setDemo(d => ({ ...d, trips: fn(d.trips) })) : setSavedTrips(fn);
  const setNames = fn => demo ? setDemo(d => ({ ...d, names: fn(d.names) })) : setSavedNames(fn);
  const displayNames = { a: names.a || "You", b: names.b || "Partner" };

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
    setItems(() => []); setTrips(() => []);
    setShowClearConfirm(false);
  }

  function handleStart() {
    setOnboarded(true);
    setFocusItemForm(true);
  }

  function startDemo() {
    setDemo({ ...makeSampleData(), fromSaved: onboarded });
    setShowHelp(false);
  }

  const showWelcome = !onboarded && !demo;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f7f4ef 0%, #ede9e2 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      {showClearConfirm && (
        <ConfirmPopup message="Start fresh? This will clear all items and trips for the new week."
          confirmLabel="Clear all" onConfirm={handleClearAll} onCancel={() => setShowClearConfirm(false)} />
      )}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <header className="mb-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl text-stone-900 leading-none" style={SERIF}>
                Cost Splitter
              </h1>
              <p className="mt-2 text-sm text-stone-500">For two people who shop together but don&apos;t eat the same.</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                <EditableName value={names.a} placeholder="You" onChange={name => setNames(n => ({ ...n, a: name }))} />
                <span className="text-xs text-stone-300 font-mono">&</span>
                <EditableName value={names.b} placeholder="Partner" onChange={name => setNames(n => ({ ...n, b: name }))} />
              </div>
              {!showWelcome && (
                <button type="button" onClick={() => setShowHelp(open => !open)}
                  aria-expanded={showHelp} aria-controls="how-it-works"
                  className="px-2 py-1 text-xs text-stone-500 hover:text-amber-600 transition-colors">
                  {showHelp ? "Hide how it works" : "How it works"}
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-stone-300 via-stone-200 to-transparent" />
        </header>

        {showWelcome ? (
          <WelcomeCard onStart={handleStart} onTryDemo={startDemo} />
        ) : (
          <>
            {/* Reopened "How it works": slides open by animating the grid row from 0fr to 1fr. */}
            <div inert={!showHelp}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${showHelp ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <WelcomeCard id="how-it-works" onTryDemo={demo ? null : startDemo} onClose={() => setShowHelp(false)} />
              </div>
            </div>
            {demo && <DemoBanner reassure={demo.fromSaved} onExit={() => setDemo(null)} />}
            <NetBalanceSummary items={items} names={displayNames} onClearAll={() => setShowClearConfirm(true)} />
            <FormTabContainer names={displayNames} autoFocus={focusItemForm} onSaveItem={handleSaveItem} onSaveTrip={handleSaveTrip} />
            <ItemList items={items} trips={trips} names={displayNames}
              onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem}
              onUpdateTrip={handleUpdateTrip} onDeleteTrip={handleDeleteTrip}
              onAddItem={handleAddItem} />
          </>
        )}
      </div>
    </div>
  );
}
