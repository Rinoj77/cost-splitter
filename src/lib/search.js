export function matchesSearch(name, rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  const n = name.toLowerCase();
  return query.split(/\s+/).filter(Boolean).every(part => {
    if (n.includes(part)) return true;
    let pi = 0;
    for (let i = 0; i < n.length && pi < part.length; i++) { if (n[i] === part[pi]) pi++; }
    return pi === part.length;
  });
}
