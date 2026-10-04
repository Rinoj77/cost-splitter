import { LS_ITEMS, LS_NAMES, LS_ONBOARDED, LS_TRIPS, saveStored } from "./storage";
import { todayISO } from "./format";
import { newRecordMeta } from "./items";

// The calculation test set from docs/calculation-test.md (A = Rinoj, B = Partner).
// Keep both in sync: the checklist lists the expected shares and balances for exactly these items.
function makeTestData() {
  let order = 0;
  // Increasing createdAt keeps the list in entry order (newest first).
  const meta = () => ({ ...newRecordMeta(), createdAt: Date.now() + order++ });
  const solo = (name, cost, shareA, shareB, paidBy) => ({ ...meta(), name, cost, shareA, shareB, paidBy });

  const trip = { ...meta(), name: "Lidl run", date: todayISO(), paidBy: "b" };
  const tripItem = (name, cost, shareA, shareB) => ({ ...meta(), groupId: trip.id, name, cost, shareA, shareB, paidBy: "b" });

  return {
    names: { a: "Rinoj", b: "Partner" },
    trips: [trip],
    items: [
      solo("Bread", 4.00, 50, 50, "a"),
      solo("Shampoo", 6.49, 100, 0, "a"),
      solo("Wine", 12.99, 30, 70, "b"),
      solo("Cheese", 10.00, 33.33, 66.67, "b"),
      solo("Gift", 25.00, 0, 100, "a"),
      tripItem("Pasta", 2.49, 50, 50),
      tripItem("Coffee beans", 8.99, 60, 40),
      tripItem("Oat milk", 1.89, 20, 80),
      tripItem("Chocolate", 2.29, 70, 30),
    ],
  };
}

// Dev server only (called behind import.meta.env.DEV): opening the app with ?testdata replaces
// the saved localhost data with the test set, after a confirm. Runs before the app reads storage.
export function loadTestDataFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("testdata")) return;
  url.searchParams.delete("testdata");
  window.history.replaceState(null, "", url);
  if (!window.confirm("Replace the data saved on this localhost with the calculation test set?")) return;
  const { names, items, trips } = makeTestData();
  saveStored(LS_NAMES, names);
  saveStored(LS_ITEMS, items);
  saveStored(LS_TRIPS, trips);
  saveStored(LS_ONBOARDED, true);
}
