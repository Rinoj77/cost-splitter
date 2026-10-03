// Shares are valid when they total 100, within float noise from decimal inputs.
export function totalIs100(total) {
  return Math.abs(total - 100) < 0.001;
}

// Each person's cost in euros, rounded to cents so the two shares always add up to the item cost.
export function itemShares(cost, shareA, shareB) {
  const totalCents = Math.round((cost || 0) * 100);
  const aCents = Math.round(totalCents * ((shareA || 0) / 100));
  const bCents = totalIs100((shareA || 0) + (shareB || 0))
    ? totalCents - aCents
    : Math.round(totalCents * ((shareB || 0) / 100));
  return { a: aCents / 100, b: bCents / 100 };
}

export function computeBalances(items) {
  let netA = 0, netB = 0;
  for (const item of items) {
    const { a: shouldA, b: shouldB } = itemShares(item.cost, item.shareA, item.shareB);
    netA += (item.paidBy === "a" ? item.cost : 0) - shouldA;
    netB += (item.paidBy === "b" ? item.cost : 0) - shouldB;
  }
  let settlement = null;
  if (Math.abs(netA) > 0.001) {
    settlement = netA < 0
      ? { debtor: "a", creditor: "b", amount: netA }
      : { debtor: "b", creditor: "a", amount: netB };
  }
  return { netA, netB, settlement };
}

export function computeTripShares(tripItems) {
  return tripItems.reduce(
    (acc, item) => {
      const { a, b } = itemShares(item.cost, item.shareA, item.shareB);
      return { shareA: acc.shareA + a, shareB: acc.shareB + b };
    },
    { shareA: 0, shareB: 0 }
  );
}
