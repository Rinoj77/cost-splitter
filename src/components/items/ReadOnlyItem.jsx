import { ItemDisplayRow } from "./ItemDisplayRow";
import { SharesFooter } from "./SharesFooter";
import { ItemColHeaders } from "../ui/ColHeaders";
import { itemShares } from "../../lib/ledger";

// Read-only item card. `nested` is the lighter style used inside an expanded trip.
export function ReadOnlyItem({ item, names, nested = false, dimmed = false, actions = null }) {
  const { a, b } = itemShares(item.cost, item.shareA, item.shareB);
  const frame = nested
    ? `border-stone-100 transition-opacity ${dimmed ? "opacity-40" : ""}`
    : "border-stone-200 shadow-sm";
  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${frame}`}>
      <div className="px-4 pt-3 pb-1"><ItemColHeaders names={names} faint={nested} /></div>
      <ItemDisplayRow item={item} className="px-4 pb-3 border-b border-stone-100" />
      <SharesFooter names={names} shareA={a} shareB={b}>{actions}</SharesFooter>
    </div>
  );
}
