import { SERIF } from "../lib/styles";

const STEPS = [
  ["Add what you bought", "One item at a time, or a whole shopping trip."],
  ["Set each person's share", "60/40, 100/0, whatever matches who eats what."],
  ["See who owes whom", "Mark who paid and the balance updates as you go."],
];

// "How it works" card. First visit: Start + Try with sample data. Reopened from the header
// link: a close ✕ and only Try with sample data (hidden when onTryDemo is null, e.g. in demo mode).
export function WelcomeCard({ id, onStart, onTryDemo, onClose }) {
  return (
    <section id={id} aria-labelledby={id && `${id}-title`}
      className="relative bg-white border border-stone-200 rounded-2xl shadow-sm p-6 mb-6">
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Hide how it works"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
          ✕
        </button>
      )}
      <h2 id={id && `${id}-title`} className="text-2xl text-stone-900 mb-5" style={SERIF}>How it works</h2>
      <ol className="flex flex-col gap-4">
        {STEPS.map(([title, detail], i) => (
          <li key={title} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-mono text-sm font-semibold flex items-center justify-center">{i + 1}</span>
            <div>
              <p className="text-sm font-medium text-stone-800">{title}</p>
              <p className="text-sm text-stone-500">{detail}</p>
            </div>
          </li>
        ))}
      </ol>
      {(onStart || onTryDemo) && (
        <div className="flex flex-wrap items-center gap-3 mt-6">
          {onStart && (
            <button onClick={onStart}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white hover:bg-stone-700 active:scale-95 shadow-sm transition-all">
              Start splitting
            </button>
          )}
          {onTryDemo && (
            <button onClick={onTryDemo}
              className={onStart
                ? "px-5 py-2.5 rounded-xl text-sm font-medium text-stone-600 border border-stone-300 hover:border-amber-400 hover:text-amber-700 transition-all"
                : "px-5 py-2.5 rounded-xl text-sm font-semibold bg-stone-900 text-white hover:bg-stone-700 active:scale-95 shadow-sm transition-all"}>
              Try with sample data
            </button>
          )}
        </div>
      )}
    </section>
  );
}
