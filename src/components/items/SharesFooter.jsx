// "<name>'s Share €x" boxes, with an optional actions column on the right.
export function SharesFooter({ names, shareA, shareB, tone = "stone", children }) {
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
