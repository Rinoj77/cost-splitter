// [first person's %, second person's %], in the same order as the share columns.
const PRESETS = [[50, 50], [70, 30], [60, 40], [20, 80], [0, 100]];

// "Quick split (A / B): [50/50] [70/30] … ⇄". The legend names who each number belongs to;
// ⇄ swaps the current two shares. onPick receives the new shares as strings, like the inputs.
export function SplitPresets({ names, shareA, shareB, onPick, className = "" }) {
  const a = parseFloat(shareA), b = parseFloat(shareB);
  const canSwap = shareA !== "" || shareB !== "";
  // Buttons keep focus where it was, so picking a chip doesn't blur the row being edited.
  const keepFocus = e => e.preventDefault();

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-xs text-stone-400 mr-1">Quick split ({names.a} / {names.b}):</span>
      {PRESETS.map(([pa, pb]) => {
        const active = a === pa && b === pb;
        return (
          <button key={`${pa}-${pb}`} type="button" onMouseDown={keepFocus} onClick={() => onPick(String(pa), String(pb))}
            aria-pressed={active} aria-label={`${names.a} ${pa}%, ${names.b} ${pb}%`}
            className={`px-2 py-1 rounded-md text-xs font-mono border transition-colors ${active ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-700"}`}>
            {pa}/{pb}
          </button>
        );
      })}
      <button type="button" onMouseDown={keepFocus} onClick={() => onPick(shareB, shareA)} disabled={!canSwap}
        aria-label="Swap shares" title="Swap shares"
        className="ml-1 px-2 py-1 rounded-md text-xs border border-stone-200 bg-white text-stone-500 hover:border-amber-300 hover:text-amber-700 disabled:opacity-40 disabled:hover:border-stone-200 disabled:hover:text-stone-500 transition-colors">
        ⇄
      </button>
    </div>
  );
}
