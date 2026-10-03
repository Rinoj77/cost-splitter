export function PaidToggle({ checked, onToggle }) {
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
