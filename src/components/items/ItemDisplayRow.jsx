import { PaidIndicator } from "../ui/PaidIndicator";
import { Tag } from "../ui/Tag";
import { ITEM_COLS_DEL, SERIF } from "../../lib/styles";

// Read-only item cells: Name | Cost | A% | A paid | B% | B paid | action slot.
export function ItemDisplayRow({ item, compact = false, className = "", action = null }) {
  return (
    <div className={`grid ${ITEM_COLS_DEL} gap-3 items-center ${className}`}>
      <span className={`text-stone-800 font-medium truncate ${compact ? "text-sm" : ""}`} style={SERIF}>{item.name}</span>
      <span className={`font-mono text-stone-700 text-right ${compact ? "text-sm" : "font-semibold"}`}>€{item.cost.toFixed(2)}</span>
      <div className="flex justify-center"><Tag color="stone">{item.shareA}%</Tag></div>
      <div className="flex justify-center"><PaidIndicator checked={item.paidBy === "a"} /></div>
      <div className="flex justify-center"><Tag color="stone">{item.shareB}%</Tag></div>
      <div className="flex justify-center"><PaidIndicator checked={item.paidBy === "b"} /></div>
      {action ?? <div />}
    </div>
  );
}
