import { useState } from "react";
import { ItemForm } from "./ItemForm";
import { TripForm } from "./TripForm";
import { ConfirmPopup } from "../ui/ConfirmPopup";

export function FormTabContainer({ names, autoFocus = false, onSaveItem, onSaveTrip }) {
  const [activeTab, setActiveTab] = useState("item");
  const [tripFormKey, setTripFormKey] = useState(0);
  const [tripHasData, setTripHasData] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  function switchTab(tab) {
    if (tab === activeTab) return;
    if (activeTab === "trip" && tripHasData) { setPendingTab(tab); return; }
    setActiveTab(tab);
  }

  function confirmReset() {
    setTripFormKey(k => k + 1);
    setTripHasData(false);
    setActiveTab(pendingTab);
    setPendingTab(null);
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
      {pendingTab && (
        <ConfirmPopup message="You have an unsaved trip. Reset to clear or save first."
          confirmLabel="Reset & Switch" onConfirm={confirmReset} onCancel={() => setPendingTab(null)} />
      )}
      <div className="flex bg-stone-50 border-b border-stone-200">
        {[["item", "Add Item"], ["trip", "Add Trip"]].map(([tab, label]) => (
          <button key={tab} onClick={() => switchTab(tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? "bg-white border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="p-5">
        {activeTab === "item"
          ? <ItemForm names={names} autoFocus={autoFocus} onSave={onSaveItem} />
          : <TripForm key={tripFormKey} names={names} onSave={onSaveTrip} onDraftChange={setTripHasData} />
        }
      </div>
    </div>
  );
}
