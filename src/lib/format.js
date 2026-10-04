// List order: a trip sorts by its date (counted as the end of that local day), a solo item by createdAt.
export function tripSortTime(trip) {
  const t = new Date(`${trip.date}T23:59:59.999`).getTime();
  return Number.isNaN(t) ? trip.createdAt : t;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

// Local calendar date as YYYY-MM-DD (toISOString would give the UTC date).
export function todayISO() {
  return daysAgoISO(0);
}

export function daysAgoISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
