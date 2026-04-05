# Manual Verification Checklist — Payment Management Screen

**Epic:** 2 (Payment Management) | **Story:** 1 | **Route:** http://localhost:3000/payments

## Pre-requisites
- The dev server is running (`npm run dev` from `web/`)
- The database has been seeded (`npx prisma db seed` from `web/`)

## Checks

### Main Grid (Payments Ready for Payment)
- [ ] **Grid displays** — You see a table titled "Payments Ready for Payment" with a count in parentheses.
- [ ] **Correct columns** — The table has columns: checkbox, Agency, Claim Date, Agent, Bond Amount, Commission Type, Commission %, Grant Date, Reg Date, Bank, Commission Amount, VAT, Status, Action.
- [ ] **Only READY payments shown** — Only payments with state "READY" appear in this grid.
- [ ] **Currency formatting** — Bond Amount, Commission Amount, and VAT values use ZAR format (R X XXX,XX).
- [ ] **Percentage formatting** — Commission % displays like "1.039%".
- [ ] **Status badges** — REG shows with green badge, MAN-PAY shows with purple badge.

### Parked Grid
- [ ] **Grid displays** — Below the main grid, you see a "Parked Payments" table with count.
- [ ] **Only PARKED payments shown** — Only payments with state "PARKED" appear in this grid.
- [ ] **Unpark button** — Each parked payment row has an "Unpark" button.

### Search Filters
- [ ] **Claim Date filter** — Entering a date in the Claim Date field filters both grids to show only matching claim dates.
- [ ] **Agency Name filter** — Typing in Agency Name filters both grids by agency name (case-insensitive partial match).
- [ ] **Status filter** — Selecting REG or MAN-PAY from the Status dropdown filters both grids.
- [ ] **Clear Filters** — Clicking "Clear Filters" resets all filters to show all data.
- [ ] **Pre-filtered from dashboard** — Navigating from Dashboard via "View" button pre-fills the Agency Name filter.

### Single Payment Parking
- [ ] **Park button** — Each ready payment has a "Park" button.
- [ ] **Confirmation modal** — Clicking "Park" shows a confirmation modal with title "Park Payment".
- [ ] **Modal shows details** — The modal displays Agent Name, Claim Date, and Amount of the payment being parked.
- [ ] **Confirm parks payment** — Clicking "Confirm" in the modal moves the payment to the Parked grid (page refreshes data).
- [ ] **Cancel closes modal** — Clicking "Cancel" closes the modal without any changes.

### Bulk Parking
- [ ] **Checkbox selection** — Each ready payment has a checkbox. Clicking the header checkbox selects all.
- [ ] **Park Selected button** — When one or more checkboxes are selected, a "Park Selected (N)" button appears.
- [ ] **Bulk modal** — Clicking "Park Selected" shows a modal with the number of payments and total amount.
- [ ] **Confirm bulk park** — Confirming moves all selected payments to the Parked grid.

### Unparking
- [ ] **Unpark single** — Clicking "Unpark" on a parked payment shows confirmation modal with details.
- [ ] **Confirm unpark** — Confirming moves the payment back to the Ready grid.
- [ ] **Bulk unpark** — Selecting multiple parked payments shows "Unpark Selected" button. Confirming moves them all back.

### Initiate Payment (Batch Processing)
- [ ] **Initiate Payment button** — There is an "Initiate Payment" button above the ready grid.
- [ ] **Confirmation modal** — Clicking it shows a modal with the number of payments and total value.
- [ ] **Confirm processes** — Confirming creates a payment batch, marks payments as PROCESSED, and shows a success modal.
- [ ] **Success modal** — After processing, a green "Payment Processed" success modal appears.
- [ ] **Payments removed** — After processing, the ready payments disappear from the main grid.
- [ ] **Disabled when empty** — The "Initiate Payment" button is disabled when there are no ready payments.
