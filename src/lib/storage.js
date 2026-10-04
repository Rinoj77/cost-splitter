export const LS_ITEMS = "splittab_items";

export const LS_NAMES = "splittab_names";

export const LS_TRIPS = "splittab_trips";

export const LS_ONBOARDED = "splittab_onboarded";

// Empty names show as "You" / "Partner" placeholders until the user renames them.
const DEFAULT_NAMES = { a: "", b: "" };

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

// True once the user clicked Start on the welcome card. Visitors from before the welcome
// card existed (saved items or non-empty names) count as onboarded too.
export function loadOnboarded() {
  if (loadStored(LS_ONBOARDED, false, v => typeof v === "boolean")) return true;
  const names = loadNames();
  return loadItems().length > 0 || loadTrips().length > 0 || names.a !== "" || names.b !== "";
}
