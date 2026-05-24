# Cost-Splitter

**Live Demo:** [https://cost-splitter-psi.vercel.app/](https://cost-splitter-psi.vercel.app/)

Cost splitter is an application designed for couples or friends who shop together but don't consume items equally. Instead of simple 50/50 splits, it allows users to assign exact consumption percentages per item and automatically calculates a running net balance.

## Features

- **Granular Splitting:** Assign consumption percentages (e.g., 60/40, 100/0) for each item.
- **Assign paid by:** Assign which user paid for the item.
- **Trip Grouping:** Bundle multiple items under a named shopping trip with a date and a single payer. Each trip shows a running total of each person's monetary share and can be expanded to inspect individual items.
- **Strict Validation:** Form logic ensures item shares always equal exactly 100% before submission.
- **Data Persistence:** Utilizes the browser's `localStorage` to save the item list, trip list, and net balance across sessions, allowing users to build a list over several days of shopping.

## How is the Ledger Calculated?

The app calculates "who owes whom" using a Paid vs. Consumed model:

1. **Amount Paid:** The total cost of the item if the user is marked as the payer (otherwise €0.00).
2. **Amount Consumed:** The total cost multiplied by the user's percentage share.
3. **Net Balance:** `(Amount Paid) - (Amount Consumed)`.

*A negative balance means the user consumed more than they paid for (they owe money). A positive balance means they paid for more than they consumed (they are owed money).*

Trip-grouped items feed into the same ledger as solo items — `paidBy` is set at the trip level and applied to every item in that trip.

## Trip Grouping

When multiple items come from the same shopping run, you can add them as a **Trip** instead of individual entries:

1. Switch to the **Add Trip** tab in the form.
2. Enter a trip name (e.g. "Lidl Run"), pick a date, and select who paid for the whole trip.
3. Add items one by one using the input row; click **+ Add another item…** to commit each line and start the next.
4. Click **Save Trip** to save everything at once.

In the item list, trips appear as collapsed cards showing the trip name, date, and each person's total monetary share. Click the chevron to expand and see individual items. Click **Edit Trip** to edit the trip header and all items simultaneously, or add new items to the trip. Click **Delete Trip** to remove the trip and all its items together.

## Tech Stack

- **Frontend:** React (Hooks: `useState`, `useEffect`, `useRef`)
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite
- **Deployment:** Vercel
- **State Management:** In-memory React state synced with `localStorage`

