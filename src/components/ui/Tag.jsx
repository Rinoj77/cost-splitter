export function Tag({ children, color = "stone" }) {
  const colors = { stone: "bg-stone-200 text-stone-600", amber: "bg-amber-100 text-amber-700" };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-medium tracking-tight ${colors[color]}`}>
      {children}
    </span>
  );
}
