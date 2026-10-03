// 6-col item grid: Name | Cost | A% | A Paid | B% | B Paid
export const ITEM_COLS = "grid-cols-[minmax(0,1fr)_110px_80px_70px_80px_70px]";

// Same + delete/actions column
export const ITEM_COLS_DEL = "grid-cols-[minmax(0,1fr)_110px_80px_70px_80px_70px_28px]";

// 4-col trip-meta grid: Trip Name | Date | A Paid | B Paid
export const TRIP_COLS = "grid-cols-[minmax(0,1fr)_160px_90px_90px]";

// Same + accordion toggle column
export const TRIP_COLS_ACC = "grid-cols-[minmax(0,1fr)_160px_90px_90px_32px]";

export const SERIF = { fontFamily: "'DM Serif Display', Georgia, serif" };

export const inputBase =
  "bg-stone-50 border border-stone-300 rounded-md px-3 py-2 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";

export const inputAmber =
  "bg-white border border-amber-300 rounded-md px-3 py-2 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 transition";

export const shareInputCls =
  "w-14 bg-stone-50 border border-stone-300 rounded-md px-2 py-2 text-sm font-mono text-stone-800 text-right focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition";

export const shareInputAmberCls =
  "w-14 bg-white border border-amber-300 rounded-md px-2 py-2 text-sm font-mono text-right focus:outline-none focus:ring-2 focus:ring-amber-400 transition";
