import { shareInputAmberCls, shareInputCls } from "../../lib/styles";

const SHARE_CELL_STYLES = {
  form: { input: shareInputCls, percent: "text-stone-400 text-sm" },
  amber: { input: shareInputAmberCls, percent: "text-stone-400 text-sm" },
  ghost: {
    input: "w-12 bg-transparent border-none outline-none text-sm font-mono text-right placeholder-stone-300",
    percent: "text-stone-400 text-xs",
  },
};

// One "NN %" input cell; onChange receives the raw input string.
export function ShareCell({ value, onChange, variant = "form" }) {
  const styles = SHARE_CELL_STYLES[variant];
  return (
    <div className="flex items-center gap-1 justify-center">
      <input type="number" placeholder="0" min="0" max="100" step="1" value={value}
        onChange={e => onChange(e.target.value)} className={styles.input} />
      <span className={styles.percent}>%</span>
    </div>
  );
}
