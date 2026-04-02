# Cost-Splitter
**Live Demo:** https://cost-splitter-psi.vercel.app/

Cost splitter is an application designed for couples or friends who shop together but don't consume items equally. Instead of simple 50/50 splits, it allows users to assign exact consumption percentages per item and automatically calculates a running net balance.

## Features
* **Granular Splitting:** Assign consumption percentages (e.g., 60/40, 100/0) for each item.
* **Assing paid by:** Assign which user paid for the item.
* **Strict Validation:** Form logic ensures item shares always equal exactly 100% before submission.
* **Data Persistence:** Utilizes the browser's `localStorage` to save the item list and net balance across sessions, allowing users to build a list over several days of shopping.
* **Inline Editing:** Quick renaming of users and updating of existing receipt items.

## How is the Ledger Calculated?
The app calculates "who owes whom" using a Paid vs. Consumed model:
1. **Amount Paid:** The total cost of the item if the user is marked as the payer (otherwise €0.00).
2. **Amount Consumed:** The total cost multiplied by the user's percentage share.
3. **Net Balance:** `(Amount Paid) - (Amount Consumed)`.
*A negative balance means the user consumed more than they paid for (they owe money). A positive balance means they paid for more than they consumed (they are owed money).*

## Tech Stack
* **Frontend:** React (Hooks: `useState`, `useEffect`, `useRef`)
* **Styling:** Tailwind CSS v4
* **Build Tool:** Vite
* **Deployment:** Vercel
* **State Management:** In-memory React state synced with `localStorage`
