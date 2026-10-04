import { daysAgoISO } from "./format";
import { newRecordMeta } from "./items";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Example ledger for demo mode: two solo items and one trip, with fresh ids each time.
export function makeSampleData() {
  const now = Date.now();
  const meta = ago => ({ ...newRecordMeta(), createdAt: now - ago });

  const trip = { ...meta(2 * DAY), name: "Lidl run", date: daysAgoISO(2), paidBy: "b" };
  const tripItem = (name, cost, shareA, ago) =>
    ({ ...meta(ago), groupId: trip.id, name, cost, shareA, shareB: 100 - shareA, paidBy: "b" });

  return {
    names: { a: "Alex", b: "Blake" },
    trips: [trip],
    items: [
      { ...meta(HOUR), name: "Shampoo", cost: 6.49, shareA: 100, shareB: 0, paidBy: "a" },
      { ...meta(DAY), name: "Pizza night", cost: 18, shareA: 50, shareB: 50, paidBy: "a" },
      tripItem("Pasta", 2.49, 50, 2 * DAY),
      tripItem("Coffee beans", 8.99, 30, 2 * DAY),
      tripItem("Oat milk", 1.89, 0, 2 * DAY),
      tripItem("Dark chocolate", 2.29, 60, 2 * DAY),
    ],
  };
}
