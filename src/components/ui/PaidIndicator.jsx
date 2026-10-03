export function PaidIndicator({ checked }) {
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
