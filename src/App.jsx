import { useState, useEffect, useRef } from "react";

// ─── localStorage helpers ──────────────────────────────────────────────────────

const LS_ITEMS = "splittab_items";
const LS_NAMES = "splittab_names";
const LS_TRIPS = "splittab_trips";

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
function saveStored(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch (err) { console.warn(`Could not save ${key}:`, err); }
}

// Old numeric ids become strings; the old id doubled as the creation time, so keep it as createdAt.
function migrateRecord(r) {
  const migrated = { ...r, id: String(r.id), createdAt: r.createdAt ?? Number(r.id) };
  if (r.groupId != null) migrated.groupId = String(r.groupId);
  return migrated;
}

const loadItems = () => loadStored(LS_ITEMS, [], v => Array.isArray(v) && v.every(isStoredItem)).map(migrateRecord);
const loadTrips = () => loadStored(LS_TRIPS, [], v => Array.isArray(v) && v.every(isStoredTrip)).map(migrateRecord);
const loadNames = () => loadStored(LS_NAMES, DEFAULT_NAMES, isStoredNames);

// ─── Grid template constants ───────────────────────────────────────────────────
// Shared across headers, display rows, and input rows for perfect alignment.

// 6-col item grid: Name | Cost | A% | A Paid | B% | B Paid
const ITEM_COLS = "grid-cols-[minmax(0,1fr)_110px_80px_70px_80px_70px]";
// Same + delete/actions column
const ITEM_COLS_DEL = "grid-cols-[minmax(0,1fr)_110px_80px_70px_80px_70px_28px]";
// 4-col trip-meta grid: Trip Name | Date | A Paid | B Paid
const TRIP_COLS = "grid-cols-[minmax(0,1fr)_160px_90px_90px]";
// Same + accordion toggle column
const TRIP_COLS_ACC = "grid-cols-[minmax(0,1fr)_160px_90px_90px_32px]";

const SERIF = { fontFamily: "'DM Serif Display', Georgia, serif" };

// ─── Ledger logic ──────────────────────────────────────────────────────────────

// Unique id plus creation time (used for newest-first ordering).
function newRecordMeta() {
  const id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return { id, createdAt: Date.now() };
}

// Shares are valid when they total 100, within float noise from decimal inputs.
function totalIs100(total) {
  return Math.abs(total - 100) < 0.001;
}

// Each person's cost in euros, rounded to cents so the two shares always add up to the item cost.
function itemShares(cost, shareA, shareB) {
  const totalCents = Math.round((cost || 0) * 100);
  const aCents = Math.round(totalCents * ((shareA || 0) / 100));
  const bCents = totalIs100((shareA || 0) + (shareB || 0))
    ? totalCents - aCents
    : Math.round(totalCents * ((shareB || 0) / 100));
  return { a: aCents / 100, b: bCents / 100 };
}

function computeBalances(items) {
  let netA = 0, netB = 0;
  for (const item of items) {
    const { a: shouldA, b: shouldB } = itemShares(item.cost, item.shareA, item.shareB);
    netA += (item.paidBy === "a" ? item.cost : 0) - shouldA;
    netB += (item.paidBy === "b" ? item.cost : 0) - shouldB;
  }
  let settlement = null;
  if (Math.abs(netA) > 0.001) {
    settlement = netA < 0
      ? { debtor: "a", creditor: "b", amount: netA }
      : { debtor: "b", creditor: "a", amount: netB };
  }
  return { netA, netB, settlement };
}

function computeTripShares(tripItems) {
  return tripItems.reduce(
    (acc, item) => {
      const { a, b } = itemShares(item.cost, item.shareA, item.shareB);
      return { shareA: acc.shareA + a, shareB: acc.shareB + b };
    },
    { shareA: 0, shareB: 0 }
  );
}

// List order: a trip sorts by its date (counted as the end of that local day), a solo item by createdAt.
function tripSortTime(trip) {
  const t = new Date(`${trip.date}T23:59:59.999`).getTime();
  return Number.isNaN(t) ? trip.createdAt : t;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

// Local calendar date as YYYY-MM-DD (toISOString would give the UTC date).
function todayISO() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── ConfirmPopup ──────────────────────────────────────────────────────────────

function ConfirmPopup({ message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 border border-stone-200">
        <p className="text-stone-800 text-sm mb-5 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-700 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 ${danger ? "bg-rose-500 hover:bg-rose-400" : "bg-stone-900 hover:bg-stone-700"}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function Tag({ children, color = "stone" }) {
  const colors = { stone: "bg-stone-200 text-stone-600", amber: "bg-amber-100 text-amber-700" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium tracking-tight ${colors[color]}`}>
      {children}
    </span>
  );
}

function PaidToggle({ checked, onToggle }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={onToggle}
        className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${checked ? "bg-amber-400" : "bg-stone-200"}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
      <span className={`text-xs font-mono transition-colors ${checked ? "text-amber-600 font-medium" : "text-stone-400"}`}>
        {checked ? "Paid" : "—"}
      </span>
    </div>
  );
}

function PaidIndicator({ checked }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-6 rounded-full flex items-center px-0.5 ${checked ? "bg-amber-400" : "bg-stone-200"}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow-sm ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className={`text-xs font-mono ${checked ? "text-amber-600 font-medium" : "text-stone-400"}`}>
        {checked ? "Paid" : "—"}
      </span>
    </div>
  );
}

function EditableName({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);
  function commit() {
    const t = draft.trim();
    if (t) onChange(t); else setDraft(value);
    setEditing(false);
  }
  if (editing) {
    return (
      <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className="bg-transparent border-b border-amber-400 outline-none font-mono text-xs text-stone-500 w-16" />
    );
  }
  return (
    <button type="button" onClick={() => { setDraft(value); setEditing(true); }} title="Click to rename"
      className="font-mono text-xs text-stone-500 hover:text-amber-600 transition-colors border-b border-dashed border-stone-300 hover:border-amber-400">
      {value}
    </button>
  );
}

// ─── NetBalanceSummary ─────────────────────────────────────────────────────────

function NetBalanceSummary({ items, names, onClearAll }) {
  const { netA, netB, settlement } = computeBalances(items);
  const hasItems = items.length > 0;
  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 mb-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <p className="text-stone-400 text-xs font-mono uppercase tracking-widest">Net Balance</p>
        {hasItems && (
          <button onClick={onClearAll}
            className="text-xs font-mono text-stone-500 hover:text-rose-400 transition-colors border border-stone-700 hover:border-rose-800 rounded-lg px-3 py-1">
            ↺ Start New Week
          </button>
        )}
      </div>
      <div className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3 mb-3">
        {hasItems && settlement ? (
          <>
            <span className="text-sm">
              <span className="font-semibold text-amber-400">{names[settlement.debtor]}</span>
              <span className="text-stone-500 mx-2">owes</span>
              <span className="font-semibold text-stone-100">{names[settlement.creditor]}</span>
            </span>
            <span className="font-mono font-semibold text-amber-400 text-sm">€{Math.abs(settlement.amount).toFixed(2)}</span>
          </>
        ) : (
          <span className="text-stone-500 text-sm font-mono">
            {hasItems ? "All settled up ✓" : "Add items to calculate balance"}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {["a", "b"].map(key => {
          const net = key === "a" ? netA : netB;
          return (
            <div key={key} className="bg-stone-800/60 rounded-xl px-4 py-3">
              <p className="text-stone-500 text-xs font-mono mb-1">{names[key]}</p>
              <p className={`font-mono text-lg font-semibold ${!hasItems ? "text-stone-600" : net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {hasItems ? (net >= 0 ? "+" : "") + "€" + Math.abs(net).toFixed(2) : "€0.00"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function handleShareChange(value, setSelf, setOther) {
  if (value === "") { setSelf(""); setOther(""); return; }
  const v = Math.min(100, Math.max(0, parseFloat(value) || 0));
  setSelf(String(v));
  setOther(String(100 - v));
}

const inputBase =
  "bg-stone-50 border border-stone-300 rounded-md px-3 py-2 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";
const inputAmber =
  "bg-white border border-amber-300 rounded-md px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 transition";
const shareInputCls =
  "w-14 bg-stone-50 border border-stone-300 rounded-md px-2 py-2 text-sm font-mono text-stone-800 text-right focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";
const shareInputAmberCls =
  "w-14 bg-white border border-amber-300 rounded-md px-2 py-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

// Column header row — reused in multiple components
function ItemColHeaders({ names, faint = false }) {
  const cls = `text-xs font-mono uppercase tracking-wider ${faint ? "text-stone-300" : "text-stone-400"}`;
  return (
    <div className={`grid ${ITEM_COLS_DEL} gap-3 items-end`}>
      <p className={cls}>Item Name</p>
      <p className={`${cls} text-right`}>Cost (€)</p>
      <p className={`${cls} text-center`}>{names.a} %</p>
      <p className={`${cls} text-center`}>{names.a} Paid</p>
      <p className={`${cls} text-center`}>{names.b} %</p>
      <p className={`${cls} text-center`}>{names.b} Paid</p>
      <div />
    </div>
  );
}

function TripMetaColHeaders({ names, withAccordion = false }) {
  const cls = "text-xs font-mono text-stone-400 uppercase tracking-wider";
  return (
    <div className={`grid ${withAccordion ? TRIP_COLS_ACC : TRIP_COLS} gap-3 items-end`}>
      <p className={cls}>Trip Name</p>
      <p className={cls}>Trip Date</p>
      <p className={`${cls} text-center`}>{names.a} Paid</p>
      <p className={`${cls} text-center`}>{names.b} Paid</p>
      {withAccordion && <div />}
    </div>
  );
}

// ─── Shared item pieces ────────────────────────────────────────────────────────

// Share-percent total of two form strings (blank/invalid counts as 0).
function shareTotal(shareA, shareB) {
  const a = parseFloat(shareA), b = parseFloat(shareB);
  return (isNaN(a) ? 0 : a) + (isNaN(b) ? 0 : b);
}

// Returns the cleaned item fields (name, cost, shareA, shareB, paidBy) if the form
// fields are complete and valid, otherwise null. Callers add id/createdAt/groupId.
function validateItem(fields, paidBy) {
  const cost = parseFloat(fields.cost);
  const shareA = parseFloat(fields.shareA);
  const shareB = parseFloat(fields.shareB);
  if (!fields.name.trim() || !(cost > 0) || !totalIs100(shareA + shareB) || !paidBy) return null;
  return { name: fields.name.trim(), cost, shareA, shareB, paidBy };
}

const SHARE_CELL_STYLES = {
  form: { input: shareInputCls, percent: "text-stone-400 text-sm" },
  amber: { input: shareInputAmberCls, percent: "text-stone-400 text-sm" },
  ghost: {
    input: "w-12 bg-transparent border-none outline-none text-sm font-mono text-right placeholder-stone-300",
    percent: "text-stone-400 text-xs",
  },
};

// One "NN %" input cell; onChange receives the raw input string.
function ShareCell({ value, onChange, variant = "form" }) {
  const styles = SHARE_CELL_STYLES[variant];
  return (
    <div className="flex items-center gap-1 justify-center">
      <input type="number" placeholder="0" min="0" max="100" step="1" value={value}
        onChange={e => onChange(e.target.value)} className={styles.input} />
      <span className={styles.percent}>%</span>
    </div>
  );
}

// Read-only item cells: Name | Cost | A% | A paid | B% | B paid | action slot.
function ItemDisplayRow({ item, compact = false, className = "", action = null }) {
  return (
    <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center ${className}`}>
      <span className={`text-stone-800 font-medium truncate ${compact ? "text-sm" : ""}`} style={SERIF}>{item.name}</span>
      <span className={`font-mono text-stone-700 text-right ${compact ? "text-sm" : "font-semibold"}`}>€{item.cost.toFixed(2)}</span>
      <div className="flex justify-center"><Tag color="stone">{item.shareA}%</Tag></div>
      <div className="flex justify-center"><PaidIndicator checked={item.paidBy === "a"} /></div>
      <div className="flex justify-center"><Tag color="stone">{item.shareB}%</Tag></div>
      <div className="flex justify-center"><PaidIndicator checked={item.paidBy === "b"} /></div>
      {action ?? <div />}
    </div>
  );
}

// "<name>'s Share €x" boxes, with an optional actions column on the right.
function SharesFooter({ names, shareA, shareB, tone = "stone", children }) {
  const amber = tone === "amber";
  return (
    <div className={`grid ${children ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-2"} divide-x ${amber ? "divide-amber-100 border-t border-amber-100" : "divide-stone-100"}`}>
      {[["a", shareA], ["b", shareB]].map(([key, amount]) => (
        <div key={key} className={`px-4 py-2.5 ${amber ? "bg-amber-50/60" : "bg-stone-50/60"}`}>
          <p className="text-xs text-stone-400 font-mono mb-0.5">{names[key]}&apos;s Share</p>
          <p className="font-mono font-semibold text-stone-700 text-sm">€{amount.toFixed(2)}</p>
        </div>
      ))}
      {children && (
        <div className={`flex flex-col items-center justify-center gap-2 px-4 py-2.5 ${amber ? "bg-amber-50/30" : "bg-stone-50/30"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

// Read-only item card. `nested` is the lighter style used inside an expanded trip.
function ReadOnlyItem({ item, names, nested = false, dimmed = false, actions = null }) {
  const { a, b } = itemShares(item.cost, item.shareA, item.shareB);
  const frame = nested
    ? `border-stone-100 transition-opacity ${dimmed ? "opacity-40" : ""}`
    : "border-stone-200 shadow-sm";
  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${frame}`}>
      <div className="px-4 pt-3 pb-1"><ItemColHeaders names={names} faint={nested} /></div>
      <ItemDisplayRow item={item} className="px-4 pb-3 border-b border-stone-100" />
      <SharesFooter names={names} shareA={a} shareB={b}>{actions}</SharesFooter>
    </div>
  );
}

// ─── ItemForm (Add Item tab) ───────────────────────────────────────────────────

const EMPTY_FORM = { name: "", cost: "", shareA: "", shareB: "", paidBy: null };

function ItemForm({ names, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const total = shareTotal(form.shareA, form.shareB);
  const sharesValid = totalIs100(total);
  const hasShareInput = form.shareA !== "" || form.shareB !== "";
  const validated = validateItem(form, form.paidBy);
  const canSubmit = validated !== null;

  function onSubmit() {
    if (!validated) return;
    onSave({ ...newRecordMeta(), ...validated });
    setForm(EMPTY_FORM);
  }

  return (
    <div>
      <div className="mb-1"><ItemColHeaders names={names} /></div>
      <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center`}>
        <input type="text" placeholder="e.g. Pasta, Shampoo…" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputBase} />
        <input type="number" placeholder="0.00" min="0" step="0.01" value={form.cost}
          onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className={`${inputBase} font-mono text-right`} />
        <ShareCell value={form.shareA}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareA: s })), s => setForm(f => ({ ...f, shareB: s })))} />
        <div className="flex justify-center">
          <PaidToggle checked={form.paidBy === "a"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "a" ? null : "a" }))} />
        </div>
        <ShareCell value={form.shareB}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareB: s })), s => setForm(f => ({ ...f, shareA: s })))} />
        <div className="flex justify-center">
          <PaidToggle checked={form.paidBy === "b"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "b" ? null : "b" }))} />
        </div>
        <div />
      </div>
      {hasShareInput && !sharesValid && (
        <p className="text-xs text-rose-500 font-mono mt-2">⚠ Shares must add up to exactly 100% (currently {total}%)</p>
      )}
      <div className="flex justify-end pt-3">
        <button onClick={onSubmit} disabled={!canSubmit}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${canSubmit ? "bg-stone-900 text-white hover:bg-stone-700 active:scale-95 shadow-sm cursor-pointer" : "bg-stone-100 text-stone-400 cursor-not-allowed"}`}>
          + Add to list
        </button>
      </div>
    </div>
  );
}

// ─── TripItemGhostRow ──────────────────────────────────────────────────────────
// Active input row + ghost "Add another item" row below.
// paidBy is locked to the trip level — shown as PaidIndicator, not a toggle.

// Controlled: the parent owns `form` so it can include a pending item on Save,
// warn about it as unsaved data, and keep it when the trip payer changes.

const EMPTY_GHOST_FORM = { name: "", cost: "", shareA: "", shareB: "" };

function hasGhostInput(form) {
  return form.name !== "" || form.cost !== "" || form.shareA !== "" || form.shareB !== "";
}

function TripItemGhostRow({ paidBy, form, setForm, onCommit }) {
  const nameRef = useRef(null);

  const total = shareTotal(form.shareA, form.shareB);
  const sharesValid = totalIs100(total);
  const hasAnyInput = hasGhostInput(form);

  function commit() {
    const validated = validateItem(form, paidBy);
    if (!validated) {
      nameRef.current?.focus();
      return;
    }
    onCommit({ ...newRecordMeta(), ...validated });
    setForm(EMPTY_GHOST_FORM);
    nameRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Active input row */}
      <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center px-3 py-2 rounded-xl border bg-white ${hasAnyInput ? "border-stone-300" : "border-dashed border-stone-200"}`}>
        <input ref={nameRef} type="text" placeholder="Item name…" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && commit()}
          className="bg-transparent border-none outline-none text-sm text-stone-800 placeholder-stone-300 w-full" />
        <input type="number" placeholder="0.00" min="0" step="0.01" value={form.cost}
          onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
          className="bg-transparent border-none outline-none text-sm font-mono text-stone-800 text-right w-full placeholder-stone-300" />
        <ShareCell variant="ghost" value={form.shareA}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareA: s })), s => setForm(f => ({ ...f, shareB: s })))} />
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "a"} /></div>
        <ShareCell variant="ghost" value={form.shareB}
          onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareB: s })), s => setForm(f => ({ ...f, shareA: s })))} />
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "b"} /></div>
        <div />
      </div>
      {hasAnyInput && !sharesValid && form.shareA !== "" && (
        <p className="text-xs text-rose-500 font-mono px-3">⚠ Shares must add up to 100% (currently {total}%)</p>
      )}
      {/* Ghost row */}
      <button onClick={commit}
        className="w-full px-3 py-2 text-left text-xs font-mono text-stone-400 hover:text-stone-600 hover:bg-stone-100/80 rounded-xl border border-dashed border-stone-200 transition-colors">
        + Add another item…
      </button>
    </div>
  );
}

// ─── TripForm (Add Trip tab) ───────────────────────────────────────────────────

const newTripDraft = () => ({ name: "", date: todayISO(), paidBy: null, items: [] });

function TripForm({ names, onSave, onDraftChange }) {
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

// ─── FormTabContainer ──────────────────────────────────────────────────────────

function FormTabContainer({ names, onSaveItem, onSaveTrip }) {
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
          ? <ItemForm names={names} onSave={onSaveItem} />
          : <TripForm key={tripFormKey} names={names} onSave={onSaveTrip} onDraftChange={setTripHasData} />
        }
      </div>
    </div>
  );
}

// ─── ItemRow (solo item, inline-editable) ─────────────────────────────────────

function ItemRow({ item, names, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);

  function startEdit() {
    setForm({ name: item.name, cost: String(item.cost), shareA: String(item.shareA), shareB: String(item.shareB), paidBy: item.paidBy });
    setEditing(true);
  }
  function cancelEdit() { setEditing(false); setForm(null); }

  const validated = form ? validateItem(form, form.paidBy) : null;
  function saveEdit() {
    if (!validated) return;
    onSave({ ...item, ...validated });
    setEditing(false); setForm(null);
  }

  if (editing && form) {
    const total = shareTotal(form.shareA, form.shareB);
    const sharesValid = totalIs100(total);
    const shares = itemShares(parseFloat(form.cost), parseFloat(form.shareA), parseFloat(form.shareB));
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 pt-3 pb-1"><ItemColHeaders names={names} /></div>
        <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center px-4 pb-3`}>
          <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputAmber} />
          <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className={`${inputAmber} font-mono text-right`} />
          <ShareCell variant="amber" value={form.shareA}
            onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareA: s })), s => setForm(f => ({ ...f, shareB: s })))} />
          <div className="flex justify-center">
            <PaidToggle checked={form.paidBy === "a"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "a" ? null : "a" }))} />
          </div>
          <ShareCell variant="amber" value={form.shareB}
            onChange={v => handleShareChange(v, s => setForm(f => ({ ...f, shareB: s })), s => setForm(f => ({ ...f, shareA: s })))} />
          <div className="flex justify-center">
            <PaidToggle checked={form.paidBy === "b"} onToggle={() => setForm(f => ({ ...f, paidBy: f.paidBy === "b" ? null : "b" }))} />
          </div>
          <div />
        </div>
        {!sharesValid && (form.shareA !== "" || form.shareB !== "") && (
          <p className="text-xs text-rose-500 font-mono px-4 pb-2">⚠ Shares must add up to 100% (currently {total}%)</p>
        )}
        <SharesFooter names={names} shareA={shares.a} shareB={shares.b} tone="amber">
          <button onClick={saveEdit} disabled={!validated}
            className={`text-xs font-mono px-2 py-1 rounded w-full text-center transition-colors ${validated ? "text-amber-700 hover:bg-amber-100 cursor-pointer" : "text-stone-300 cursor-not-allowed"}`}>
            ✓ Save
          </button>
          <button onClick={cancelEdit}
            className="text-xs font-mono text-stone-400 hover:text-stone-700 transition-colors px-2 py-1 rounded hover:bg-stone-100 w-full text-center">
            ✕ Cancel
          </button>
        </SharesFooter>
      </div>
    );
  }

  return (
    <ReadOnlyItem item={item} names={names} actions={
      <>
        <button onClick={startEdit}
          className="text-xs font-mono text-stone-400 hover:text-amber-600 transition-colors px-2 py-1 rounded hover:bg-amber-50 w-full text-center">
          ✎ Edit
        </button>
        <button onClick={() => onDelete(item.id)}
          className="text-xs font-mono text-stone-400 hover:text-rose-500 transition-colors px-2 py-1 rounded hover:bg-rose-50 w-full text-center">
          ✕ Delete
        </button>
      </>
    } />
  );
}

// ─── TripItemEditRow (editable item row inside Edit Trip mode) ────────────────

function TripItemEditRow({ item, names, paidBy, draft, onChange, onDelete }) {
  const total = shareTotal(draft.shareA, draft.shareB);
  const sharesValid = totalIs100(total);
  const { a: costA, b: costB } = itemShares(parseFloat(draft.cost), parseFloat(draft.shareA), parseFloat(draft.shareB));

  // Apply both share fields in one onChange so neither update clobbers the other.
  function changeShares(value, self, other) {
    const next = { ...draft };
    handleShareChange(value, v => { next[self] = v; }, v => { next[other] = v; });
    onChange(next);
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      <div className="px-4 pt-3 pb-1"><ItemColHeaders names={names} /></div>
      <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center px-4 pb-3`}>
        <input type="text" value={draft.name}
          onChange={e => onChange({ ...draft, name: e.target.value })}
          className={inputAmber} />
        <input type="number" min="0" step="0.01" value={draft.cost}
          onChange={e => onChange({ ...draft, cost: e.target.value })}
          className={`${inputAmber} font-mono text-right`} />
        <ShareCell variant="amber" value={draft.shareA} onChange={v => changeShares(v, "shareA", "shareB")} />
        {/* paidBy locked — show indicator, not toggle */}
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "a"} /></div>
        <ShareCell variant="amber" value={draft.shareB} onChange={v => changeShares(v, "shareB", "shareA")} />
        <div className="flex justify-center"><PaidIndicator checked={paidBy === "b"} /></div>
        <button onClick={() => onDelete(item.id)}
          className="text-xs font-mono text-stone-300 hover:text-rose-400 transition-colors text-center">✕</button>
      </div>
      {!sharesValid && (draft.shareA !== "" || draft.shareB !== "") && (
        <p className="text-xs text-rose-500 font-mono px-4 pb-2">⚠ Shares must add up to 100% (currently {total}%)</p>
      )}
      <SharesFooter names={names} shareA={costA} shareB={costB} tone="amber" />
    </div>
  );
}

// ─── TripCard ──────────────────────────────────────────────────────────────────

function TripCard({ trip, tripItems, matchedItemIds, names, onUpdateTrip, onDeleteTrip, onUpdateItem, onDeleteItem, onAddItem }) {
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

// ─── Search helper ─────────────────────────────────────────────────────────────

function matchesSearch(name, rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  const n = name.toLowerCase();
  return query.split(/\s+/).filter(Boolean).every(part => {
    if (n.includes(part)) return true;
    let pi = 0;
    for (let i = 0; i < n.length && pi < part.length; i++) { if (n[i] === part[pi]) pi++; }
    return pi === part.length;
  });
}

// ─── ItemList ──────────────────────────────────────────────────────────────────

function ItemList({ items, trips, names, onUpdateItem, onDeleteItem, onUpdateTrip, onDeleteTrip, onAddItem }) {
  const [search, setSearch] = useState("");
  const soloItems = items.filter(i => !i.groupId);
  const q = search.trim();

  const entries = [];
  for (const trip of trips) {
    const tripItems = items.filter(i => i.groupId === trip.id);
    const tripNameMatches = !q || matchesSearch(trip.name, q);
    const matchedItems = q ? tripItems.filter(i => matchesSearch(i.name, q)) : tripItems;
    if (tripNameMatches || matchedItems.length > 0) {
      // Cards always get the full item list; matchedItemIds only marks which items hit the search.
      const matchedItemIds = q && !tripNameMatches ? new Set(matchedItems.map(i => i.id)) : null;
      entries.push({ type: "trip", id: trip.id, sortTime: tripSortTime(trip), createdAt: trip.createdAt, trip, tripItems, matchedItemIds });
    }
  }
  for (const item of soloItems) {
    if (!q || matchesSearch(item.name, q)) entries.push({ type: "item", id: item.id, sortTime: item.createdAt, createdAt: item.createdAt, item });
  }
  entries.sort((a, b) => b.sortTime - a.sortTime || b.createdAt - a.createdAt);

  const hasContent = items.length > 0 || trips.length > 0;
  const totalCost = items.reduce((s, i) => s + i.cost, 0);

  return (
    <div>
      <div className="relative mb-4">
        <label htmlFor="item-list-search" className="sr-only">Search items by name</label>
        <input id="item-list-search" type="text" role="searchbox" autoComplete="off"
          placeholder="Search items or trips…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-3 pr-10 py-2.5 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition" />
        {search.length > 0 && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/80 transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-stone-800" style={SERIF}>Items</h2>
        {hasContent && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {q ? (
              <Tag color="stone">{entries.length} result{entries.length !== 1 ? "s" : ""}</Tag>
            ) : (
              <>
                <Tag color="stone">{trips.length} trip{trips.length !== 1 ? "s" : ""}</Tag>
                <Tag color="stone">{soloItems.length} solo item{soloItems.length !== 1 ? "s" : ""}</Tag>
                <Tag color="stone">€{totalCost.toFixed(2)} total</Tag>
              </>
            )}
          </div>
        )}
      </div>

      {!hasContent ? (
        <div className="text-center py-16 text-stone-300 border border-dashed border-stone-200 rounded-2xl">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-mono text-sm">No items yet. Add one above.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-14 text-stone-400 border border-dashed border-stone-200 rounded-2xl bg-white/50">
          <p className="font-mono text-sm mb-1">No items match &ldquo;{q}&rdquo;</p>
          <p className="text-xs text-stone-400">Try another name or clear the search.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(entry =>
            entry.type === "trip" ? (
              <TripCard key={entry.id} trip={entry.trip} tripItems={entry.tripItems} matchedItemIds={entry.matchedItemIds} names={names}
                onUpdateTrip={onUpdateTrip} onDeleteTrip={onDeleteTrip}
                onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem} onAddItem={onAddItem} />
            ) : (
              <ItemRow key={entry.id} item={entry.item} names={names}
                onSave={onUpdateItem} onDelete={onDeleteItem} />
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [items, setItems] = useState(() => loadItems());
  const [trips, setTrips] = useState(() => loadTrips());
  const [names, setNames] = useState(() => loadNames());

  useEffect(() => { saveStored(LS_ITEMS, items); }, [items]);
  useEffect(() => { saveStored(LS_TRIPS, trips); }, [trips]);
  useEffect(() => { saveStored(LS_NAMES, names); }, [names]);

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
    if (window.confirm("Start fresh? This will clear all items and trips for the new week.")) {
      setItems([]); setTrips([]);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(160deg, #f7f4ef 0%, #ede9e2 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>
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

        <NetBalanceSummary items={items} names={names} onClearAll={handleClearAll} />
        <FormTabContainer names={names} onSaveItem={handleSaveItem} onSaveTrip={handleSaveTrip} />
        <ItemList items={items} trips={trips} names={names}
          onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem}
          onUpdateTrip={handleUpdateTrip} onDeleteTrip={handleDeleteTrip}
          onAddItem={handleAddItem} />
      </div>
    </div>
  );
}
