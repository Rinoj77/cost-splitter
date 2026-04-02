import { useState, useEffect, useRef } from "react";

// ─── localStorage helpers ──────────────────────────────────────────────────────

const LS_ITEMS = "splittab_items";
const LS_NAMES = "splittab_names";

function loadItems() {
  try {
    const raw = localStorage.getItem(LS_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadNames() {
  try {
    const raw = localStorage.getItem(LS_NAMES);
    return raw ? JSON.parse(raw) : { a: "Alex", b: "Blake" };
  } catch {
    return { a: "Alex", b: "Blake" };
  }
}

// ─── Ledger Logic ─────────────────────────────────────────────────────────────

function computeBalances(items) {
  let netA = 0;
  let netB = 0;

  for (const item of items) {
    const cost = item.cost;
    const shouldA = cost * (item.shareA / 100);
    const shouldB = cost * (item.shareB / 100);
    const paidA = item.paidBy === "a" ? cost : 0;
    const paidB = item.paidBy === "b" ? cost : 0;
    netA += paidA - shouldA;
    netB += paidB - shouldB;
  }

  // settlement.amount is a raw negative float — Math.abs() applied only at render time
  let settlement = null;
  if (Math.abs(netA) > 0.001) {
    if (netA < 0) {
      settlement = { debtor: "a", creditor: "b", amount: netA };
    } else {
      settlement = { debtor: "b", creditor: "a", amount: netB };
    }
  }

  return { netA, netB, settlement };
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Tag({ children, color = "stone" }) {
  const colors = {
    stone: "bg-stone-200 text-stone-600",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium tracking-tight ${colors[color]}`}>
      {children}
    </span>
  );
}

function PaidToggle({ checked, onToggle }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onToggle}
        className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
          checked ? "bg-amber-400" : "bg-stone-200"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
      <span className={`text-xs font-mono transition-colors ${checked ? "text-amber-600 font-medium" : "text-stone-400"}`}>
        {checked ? "Paid" : "—"}
      </span>
    </div>
  );
}

// Static paid indicator for item rows (read-only, no onClick)
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

// ─── Inline editable name ─────────────────────────────────────────────────────

function EditableName({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed.length > 0) onChange(trimmed);
    else setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="bg-transparent border-b border-amber-400 outline-none font-mono text-xs text-stone-500 w-16"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to rename"
      className="font-mono text-xs text-stone-500 hover:text-amber-600 transition-colors border-b border-dashed border-stone-300 hover:border-amber-400"
    >
      {value}
    </button>
  );
}

// ─── Net Balance Summary ──────────────────────────────────────────────────────

function NetBalanceSummary({ items, names, onClearAll }) {
  const { netA, netB, settlement } = computeBalances(items);
  const hasItems = items.length > 0;

  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 mb-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <p className="text-stone-400 text-xs font-mono uppercase tracking-widest">Net Balance</p>
        {hasItems && (
          <button
            onClick={onClearAll}
            className="text-xs font-mono text-stone-500 hover:text-rose-400 transition-colors border border-stone-700 hover:border-rose-800 rounded-lg px-3 py-1"
          >
            ↺ Start New Week
          </button>
        )}
      </div>

      {/* Settlement row */}
      <div className="flex items-center justify-between bg-stone-800 rounded-xl px-4 py-3 mb-3">
        {hasItems && settlement ? (
          <>
            <span className="text-sm">
              <span className="font-semibold text-amber-400">{names[settlement.debtor]}</span>
              <span className="text-stone-500 mx-2">owes</span>
              <span className="font-semibold text-stone-100">{names[settlement.creditor]}</span>
            </span>
            <span className="font-mono font-semibold text-amber-400 text-sm">
              €{Math.abs(settlement.amount).toFixed(2)}
            </span>
          </>
        ) : (
          <span className="text-stone-500 text-sm font-mono">
            {hasItems ? "All settled up ✓" : "Add items to calculate balance"}
          </span>
        )}
      </div>

      {/* Per-person net cards */}
      <div className="grid grid-cols-2 gap-3">
        {(["a", "b"]).map((key) => {
          const net = key === "a" ? netA : netB;
          return (
            <div key={key} className="bg-stone-800/60 rounded-xl px-4 py-3">
              <p className="text-stone-500 text-xs font-mono mb-1">{names[key]}</p>
              <p
                className={`font-mono text-lg font-semibold ${
                  !hasItems ? "text-stone-600" : net >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {hasItems ? (net >= 0 ? "+" : "") + "€" + Math.abs(net).toFixed(2) : "€0.00"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Add / Edit Item Form ─────────────────────────────────────────────────────

const EMPTY_FORM = { name: "", cost: "", shareA: "", shareB: "", paidBy: null };

function ItemForm({ names, onSave, editingItem, onCancelEdit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = editingItem !== null;

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name,
        cost: String(editingItem.cost),
        shareA: String(editingItem.shareA),
        shareB: String(editingItem.shareB),
        paidBy: editingItem.paidBy,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingItem]);

  const shareANum = parseFloat(form.shareA);
  const shareBNum = parseFloat(form.shareB);
  const totalShare = (isNaN(shareANum) ? 0 : shareANum) + (isNaN(shareBNum) ? 0 : shareBNum);
  const sharesValid = totalShare === 100;
  const hasShareInput = form.shareA !== "" || form.shareB !== "";
  const canSubmit =
    form.name.trim().length > 0 &&
    parseFloat(form.cost) > 0 &&
    sharesValid &&
    form.paidBy !== null;

  function handleShareAChange(e) {
    const raw = e.target.value;
    if (raw === "") { setForm((f) => ({ ...f, shareA: "", shareB: "" })); return; }
    const val = Math.min(100, Math.max(0, parseFloat(raw) || 0));
    setForm((f) => ({ ...f, shareA: String(val), shareB: String(100 - val) }));
  }

  function handleShareBChange(e) {
    const raw = e.target.value;
    if (raw === "") { setForm((f) => ({ ...f, shareA: "", shareB: "" })); return; }
    const val = Math.min(100, Math.max(0, parseFloat(raw) || 0));
    setForm((f) => ({ ...f, shareB: String(val), shareA: String(100 - val) }));
  }

  function handlePaidToggle(person) {
    setForm((f) => ({ ...f, paidBy: f.paidBy === person ? null : person }));
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSave({
      id: isEditing ? editingItem.id : Date.now(),
      name: form.name.trim(),
      cost: parseFloat(form.cost),
      shareA: parseFloat(form.shareA),
      shareB: parseFloat(form.shareB),
      paidBy: form.paidBy,
    });
    setForm(EMPTY_FORM);
  }

  const inputBase =
    "bg-stone-50 border border-stone-300 rounded-md px-3 py-2 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";

  return (
    <div className={`border rounded-2xl p-5 mb-6 shadow-sm transition-colors ${isEditing ? "bg-amber-50 border-amber-200" : "bg-white border-stone-200"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-stone-800 flex items-center gap-2" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          {isEditing ? <><span className="text-amber-500">✎</span> Edit Item</> : "Add Item"}
        </h2>
        <div className="flex items-center gap-2">
          {hasShareInput && (
            <span
              className={`text-xs font-mono px-2 py-1 rounded-full font-medium transition-all ${
                sharesValid
                  ? "bg-emerald-100 text-emerald-700"
                  : totalShare > 100
                  ? "bg-rose-100 text-rose-600"
                  : "bg-stone-100 text-stone-500"
              }`}
            >
              {totalShare}% / 100%
            </span>
          )}
          {isEditing && (
            <button
              onClick={onCancelEdit}
              className="text-xs font-mono text-stone-400 hover:text-stone-700 transition-colors px-2 py-1 rounded-lg border border-stone-200 hover:border-stone-300"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* 6-column grid */}
      <div className="grid grid-cols-[2fr_1fr_1fr_auto_1fr_auto] gap-3 items-end mb-1">
        {/* Column headers */}
        {[
          { label: "Item Name", align: "text-left" },
          { label: "Cost (€)", align: "text-center" },
          { label: `${names.a} %`, align: "text-center" },
          { label: `${names.a} Paid`, align: "text-center" },
          { label: `${names.b} %`, align: "text-center" },
          { label: `${names.b} Paid`, align: "text-center" },
        ].map(({ label, align }) => (
          <p key={label} className={`text-xs font-mono text-stone-400 uppercase tracking-wider pb-1 ${align}`}>
            {label}
          </p>
        ))}

        {/* Item name input */}
        <input
          type="text"
          placeholder="e.g. Pasta, Shampoo…"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputBase}
        />

        {/* Cost input */}
        <input
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={form.cost}
          onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
          className={`${inputBase} font-mono text-right`}
        />

        {/* Share A */}
        <div className="flex items-center gap-1 justify-center">
          <input
            type="number"
            placeholder="0"
            min="0"
            max="100"
            step="1"
            value={form.shareA}
            onChange={handleShareAChange}
            className="w-14 bg-stone-50 border border-stone-300 rounded-md px-2 py-2 text-sm font-mono text-stone-800 text-right focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
          <span className="text-stone-400 text-sm">%</span>
        </div>

        {/* Paid A */}
        <div className="flex justify-center">
          <PaidToggle checked={form.paidBy === "a"} onToggle={() => handlePaidToggle("a")} />
        </div>

        {/* Share B */}
        <div className="flex items-center gap-1 justify-center">
          <input
            type="number"
            placeholder="0"
            min="0"
            max="100"
            step="1"
            value={form.shareB}
            onChange={handleShareBChange}
            className="w-14 bg-stone-50 border border-stone-300 rounded-md px-2 py-2 text-sm font-mono text-stone-800 text-right focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
          />
          <span className="text-stone-400 text-sm">%</span>
        </div>

        {/* Paid B */}
        <div className="flex justify-center">
          <PaidToggle checked={form.paidBy === "b"} onToggle={() => handlePaidToggle("b")} />
        </div>
      </div>

      {/* Validation hint */}
      {hasShareInput && !sharesValid && (
        <p className="text-xs text-rose-500 font-mono mb-3 mt-2">
          ⚠ Shares must add up to exactly 100% (currently {totalShare}%)
        </p>
      )}

      <div className="flex justify-end pt-3">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
            canSubmit
              ? isEditing
                ? "bg-amber-500 text-white hover:bg-amber-400 active:scale-95 shadow-sm cursor-pointer"
                : "bg-stone-900 text-white hover:bg-stone-700 active:scale-95 shadow-sm cursor-pointer"
              : "bg-stone-100 text-stone-400 cursor-not-allowed"
          }`}
        >
          {isEditing ? "✓ Save Changes" : "+ Add to list"}
        </button>
      </div>
    </div>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

function ItemRow({ item, names, onEdit, onDelete }) {
  const cost = item.cost;
  const costA = cost * (item.shareA / 100);
  const costB = cost * (item.shareB / 100);


  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
      {/* Main row — same column layout as the form header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_auto_1fr_auto] gap-3 items-center px-4 py-3 border-b border-stone-100">
        <span className="text-stone-800 font-medium truncate" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          {item.name}
        </span>
        <span className="font-mono font-semibold text-stone-700 text-right">€{cost.toFixed(2)}</span>
        <div className="flex justify-center"><Tag color="stone">{item.shareA}%</Tag></div>
        <div className="flex justify-center"><PaidIndicator checked={item.paidBy === "a"} /></div>
        <div className="flex justify-center"><Tag color="stone">{item.shareB}%</Tag></div>
        <div className="flex justify-center"><PaidIndicator checked={item.paidBy === "b"} /></div>
      </div>

      {/* Breakdown + actions */}
      <div className="grid grid-cols-[1fr_1fr_auto] divide-x divide-stone-100">
        {[
          { key: "a", c: costA },
          { key: "b", c: costB },
        ].map(({ key, c, desc }) => (
          <div key={key} className="px-4 py-2.5 bg-stone-50/60">
            <p className="text-xs text-stone-400 font-mono mb-0.5">{names[key]}&apos;s Share</p>
            <p className="font-mono font-semibold text-stone-700 text-sm">€{c.toFixed(2)}</p>
          </div>
        ))}

        {/* Edit / Delete */}
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-2.5 bg-stone-50/30">
          <button
            onClick={() => onEdit(item)}
            className="text-xs font-mono text-stone-400 hover:text-amber-600 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-50 w-full justify-center"
          >
            ✎ Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs font-mono text-stone-400 hover:text-rose-500 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-50 w-full justify-center"
          >
            ✕ Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Item List ────────────────────────────────────────────────────────────────

function ItemList({ items, names, onEdit, onDelete }) {
  const total = items.reduce((s, i) => s + i.cost, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg text-stone-800" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          Items
        </h2>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag color="stone">{items.length} item{items.length !== 1 ? "s" : ""}</Tag>
            <Tag color="stone">€{total.toFixed(2)} total</Tag>
          </div>
        )}
      </div>

      {/* Column headers — mirrors the form */}
      {items.length > 0 && (
        <div className="grid grid-cols-[2fr_1fr_1fr_auto_1fr_auto] gap-3 items-end px-4 mb-2">
          {[
            { label: "Item Name", align: "text-left" },
            { label: "Cost (€)", align: "text-right" },
            { label: `${names.a} %`, align: "text-center" },
            { label: `${names.a} Paid`, align: "text-center" },
            { label: `${names.b} %`, align: "text-center" },
            { label: `${names.b} Paid`, align: "text-center" },
          ].map(({ label, align }) => (
            <p key={label} className={`text-xs font-mono text-stone-400 uppercase tracking-wider ${align}`}>
              {label}
            </p>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} names={names} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-stone-300 border border-dashed border-stone-200 rounded-2xl">
          <p className="text-4xl mb-3">🧾</p>
          <p className="font-mono text-sm">No items yet. Add one above.</p>
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [items, setItems] = useState(() => loadItems());
  const [names, setNames] = useState(() => loadNames());
  const [editingItem, setEditingItem] = useState(null);

  // Persist items to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LS_ITEMS, JSON.stringify(items));
  }, [items]);

  // Persist names to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LS_NAMES, JSON.stringify(names));
  }, [names]);

  function handleSaveItem(item) {
    if (editingItem) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      setEditingItem(null);
    } else {
      setItems((prev) => [item, ...prev]);
    }
  }

  function handleDeleteItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (editingItem?.id === id) setEditingItem(null);
  }

  function handleClearAll() {
    if (window.confirm("Start fresh? This will clear all items for the new week.")) {
      setItems([]);
      setEditingItem(null);
      localStorage.removeItem(LS_ITEMS);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(160deg, #f7f4ef 0%, #ede9e2 100%)", fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <header className="mb-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl text-stone-900 leading-none" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
                Cost Splitter
              </h1>
            </div>
            {/* Name pill — both names are inline-editable, click to rename */}
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-full px-4 py-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
              <EditableName
                value={names.a}
                onChange={(name) => setNames((n) => ({ ...n, a: name }))}
              />
              <span className="text-xs text-stone-300 font-mono">&</span>
              <EditableName
                value={names.b}
                onChange={(name) => setNames((n) => ({ ...n, b: name }))}
              />
            </div>
          </div>
          <div className="mt-4 h-px bg-gradient-to-r from-stone-300 via-stone-200 to-transparent" />
        </header>

        <NetBalanceSummary items={items} names={names} onClearAll={handleClearAll} />
        <ItemForm
          names={names}
          onSave={handleSaveItem}
          editingItem={editingItem}
          onCancelEdit={() => setEditingItem(null)}
        />
        <ItemList
          items={items}
          names={names}
          onEdit={setEditingItem}
          onDelete={handleDeleteItem}
        />
      </div>
    </div>
  );
}
