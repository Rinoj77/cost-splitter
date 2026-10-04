// Shown above the app while sample data is displayed; nothing in demo mode is saved.
// `reassure` adds "Your own data is safe" for users who entered the demo from their real ledger.
export function DemoBanner({ reassure = false, onExit }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-6">
      <p className="text-sm text-amber-800">
        <span className="font-semibold">You&apos;re viewing sample data.</span>{" "}
        {reassure ? "Your own data is safe. Nothing here is saved." : "Try anything. Nothing here is saved."}
      </p>
      <button onClick={onExit}
        className="text-xs font-mono text-amber-700 border border-amber-300 hover:bg-amber-100 rounded-lg px-3 py-1.5 transition-colors">
        Exit demo
      </button>
    </div>
  );
}
