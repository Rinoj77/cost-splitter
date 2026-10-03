import { useMemo } from "react";
import { computeBalances } from "../lib/ledger";

export function NetBalanceSummary({ items, names, onClearAll }) {
  const { netA, netB, settlement } = useMemo(() => computeBalances(items), [items]);
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
