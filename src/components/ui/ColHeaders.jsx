import { ITEM_COLS_DEL, TRIP_COLS, TRIP_COLS_ACC } from "../../lib/styles";

// Column header row — reused in multiple components
export function ItemColHeaders({ names, faint = false }) {
  const cls = `text-xs font-mono uppercase tracking-wider ${faint ? "text-stone-300" : "text-stone-400"}`;
  return (
    <div className={`grid ${ITEM_COLS_DEL} gap-3 items-end`}>
      <p className={cls}>Item Name</p>
      <p className={`${cls} text-right`}>Cost (€)</p>
      <p className={`${cls} text-center`}>{names.a} %</p>
      <p className={`${cls} text-center`}>{names.a} Paid</p>
      <p className={`${cls} text-center`}>{names.b} %</p>
      <p className={`${cls} text-center`}>{names.b} Paid</p>
      <div />
    </div>
  );
}

export function TripMetaColHeaders({ names, withAccordion = false }) {
  const cls = "text-xs font-mono text-stone-400 uppercase tracking-wider";
  return (
    <div className={`grid ${withAccordion ? TRIP_COLS_ACC : TRIP_COLS} gap-3 items-end`}>
      <p className={cls}>Trip Name</p>
      <p className={cls}>Trip Date</p>
      <p className={`${cls} text-center`}>{names.a} Paid</p>
      <p className={`${cls} text-center`}>{names.b} Paid</p>
      {withAccordion && <div />}
    </div>
  );
}
