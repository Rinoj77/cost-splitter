# Calculation test

A fixed set of items and a trip with known results. Run it after any change that touches
the calculation, shares, storage, or item/trip editing, to check the numbers still come out right.

The expected values were computed with the app's own `itemShares` / `computeBalances`
(`src/lib/ledger.js`). The loader's data lives in `src/lib/testData.js`; keep the two in sync.

## Load the test data

1. Start the dev server: `npm run dev`
2. Open the app with `?testdata` added, e.g. `http://localhost:5173/?testdata`
3. Confirm the prompt. This **replaces** the items, trips and names saved on that localhost
   (the live site is not affected). Names become **Rinoj** (left) and **Partner** (right).

The loader only exists on the dev server; production builds don't include it.

To enter the data by hand instead: Start New Week, name the two people Rinoj and Partner,
and add the items below.

## Test data

### Solo items

| # | Item | Cost | Rinoj % | Partner % | Paid by | Rinoj's share | Partner's share |
|---|---|---|---|---|---|---|---|
| 1 | Bread | 4.00 | 50 | 50 | Rinoj | €2.00 | €2.00 |
| 2 | Shampoo | 6.49 | 100 | 0 | Rinoj | €6.49 | €0.00 |
| 3 | Wine | 12.99 | 30 | 70 | Partner | €3.90 | €9.09 |
| 4 | Cheese | 10.00 | 33.33 | 66.67 | Partner | €3.33 | €6.67 |
| 5 | Gift | 25.00 | 0 | 100 | Rinoj | €0.00 | €25.00 |

### Trip "Lidl run", paid by Partner

| # | Item | Cost | Rinoj % | Partner % | Rinoj's share | Partner's share |
|---|---|---|---|---|---|---|
| 6 | Pasta | 2.49 | 50 | 50 | €1.25 | €1.24 |
| 7 | Coffee beans | 8.99 | 60 | 40 | €5.39 | €3.60 |
| 8 | Oat milk | 1.89 | 20 | 80 | €0.38 | €1.51 |
| 9 | Chocolate | 2.29 | 70 | 30 | €1.60 | €0.69 |

Shares are rounded to cents so the two always add up to the item cost (Pasta: €1.25 + €1.24).

## Checks

### Check 1: after loading

- [ ] Every item card shows the shares in the tables above
- [ ] Lidl run trip card: Rinoj's Share **€8.62**, Partner's Share **€7.04**
- [ ] Net balance: **Partner owes Rinoj €11.15**; Rinoj **+€11.15**, Partner **€11.15** (red)
- [ ] Item tags: **1 trip · 5 solo items · €74.14 total**

### Check 2: edit Cheese to 50/50 and save

- [ ] Cheese card shows €5.00 / €5.00
- [ ] **Partner owes Rinoj €9.48**

### Check 3: then delete the Lidl run trip

- [ ] **Partner owes Rinoj €18.10**
- [ ] Item tags: **0 trips · 5 solo items · €58.48 total**
