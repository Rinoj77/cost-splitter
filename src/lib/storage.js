export const LS_ITEMS = "splittab_items";

export const LS_NAMES = "splittab_names";

export const LS_TRIPS = "splittab_trips";

const DEFAULT_NAMES = { a: "Alex", b: "Blake" };

const isObject = v => v !== null && typeof v === "object";

const isPaidBy = v => v === "a" || v === "b";

// Ids were numeric (Date.now()) before; both forms are accepted and migrated on load.
const isStoredId = v => typeof v === "string" || Number.isFinite(v);

const isStoredItem = i =>
  isObject(i) && typeof i.name === "string" && isStoredId(i.id) && [i.cost, i.shareA, i.shareB].every(Number.isFinite) && isPaidBy(i.paidBy);

const isStoredTrip = t =>
  isObject(t) && typeof t.name === "string" && typeof t.date === "string" && isStoredId(t.id) && isPaidBy(t.paidBy);

const isStoredNames = n => isObject(n) && typeof n.a === "string" && typeof n.b === "string";

// Returns the parsed value if it exists and passes isValid, otherwise the fallback.
function loadStored(key, fallback, isValid) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value != null && isValid(value) ? value : fallback;
  } catch { return fallback; }
}

// Storage can be full or blocked (private mode); the app keeps working for the session.
export function saveStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (err) { console.warn(`Could not save ${key}:`, err); }
}

// Old numeric ids become strings; the old id doubled as the creation time, so keep it as createdAt.
function migrateRecord(r) {
  const migrated = { ...r, id: String(r.id), createdAt: r.createdAt ?? Number(r.id) };
  if (r.groupId != null) migrated.groupId = String(r.groupId);
  return migrated;
}

export const loadItems = () => loadStored(LS_ITEMS, [], v => Array.isArray(v) && v.every(isStoredItem)).map(migrateRecord);

export const loadTrips = () => loadStored(LS_TRIPS, [], v => Array.isArray(v) && v.every(isStoredTrip)).map(migrateRecord);

export const loadNames = () => loadStored(LS_NAMES, DEFAULT_NAMES, isStoredNames);

// ─── Grid template constants ───────────────────────────────────────────────────
// Shared across headers, display rows, and input rows for perfect alignment.
