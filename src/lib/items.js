import { totalIs100 } from "./ledger";

// Unique id plus creation time (used for newest-first ordering).
export function newRecordMeta() {
  const id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return { id, createdAt: Date.now() };
}

// Share-percent total of two form strings (blank/invalid counts as 0).
export function shareTotal(shareA, shareB) {
  const a = parseFloat(shareA), b = parseFloat(shareB);
  return (isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b);
}

// Returns the cleaned item fields (name, cost, shareA, shareB, paidBy) if the form
// fields are complete and valid, otherwise null. Callers add id/createdAt/groupId.
export function validateItem(fields, paidBy) {
  const cost = parseFloat(fields.cost);
  const shareA = parseFloat(fields.shareA);
  const shareB = parseFloat(fields.shareB);
  if (!fields.name.trim() || !(cost > 0) || !totalIs100(shareA + shareB) || !paidBy) return null;
  return { name: fields.name.trim(), cost, shareA, shareB, paidBy };
}

export function handleShareChange(value, setSelf, setOther) {
  if (value === "") { setSelf(""); setOther(""); return; }
  const v = Math.min(100, Math.max(0, parseFloat(value) || 0));
  setSelf(String(v));
  setOther(String(100 - v));
}

export const EMPTY_GHOST_FORM = { name: "", cost: "", shareA: "", shareB: "" };

export function hasGhostInput(form) {
  return form.name !== "" || form.cost !== "" || form.shareA !== "" || form.shareB !== "";
}
