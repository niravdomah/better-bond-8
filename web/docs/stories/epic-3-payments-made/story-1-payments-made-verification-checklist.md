# Manual Verification Checklist — Payments Made Screen

**Epic:** 3 (Payments Made) | **Story:** 1 | **Route:** http://localhost:3000/payments-made

## Pre-requisites
- The dev server is running (`npm run dev` from `web/`)
- The database has been seeded (`npx prisma db seed` from `web/`)

## Checks

### Batch Grid
- [ ] **Grid displays** — You see a table titled "Processed Payment Batches" with a count in parentheses.
- [ ] **Correct columns** — The table has columns: Reference, Agency Name, Created Date, Payments, Total Commission, VAT, Status, Invoice.
- [ ] **Only PROCESSED batches** — All batches shown have status "PROCESSED".
- [ ] **Currency formatting** — Total Commission and VAT use ZAR format (R X XXX,XX).
- [ ] **Status badge** — Each row shows a green "PROCESSED" badge.

### Search Filters
- [ ] **Agency Name filter** — Typing in the Agency Name field filters batches by agency (case-insensitive partial match).
- [ ] **Batch Reference filter** — Typing in the Batch Reference field filters by reference (case-insensitive partial match).
- [ ] **Clear Filters** — Clicking "Clear Filters" resets all filters.

### Invoice Download
- [ ] **Download button** — Each batch row has a "Download Invoice" button.
- [ ] **Invoice downloads** — Clicking "Download Invoice" triggers a file download with the batch reference in the filename.
- [ ] **Invoice content** — The downloaded file contains invoice details: agency info, payment list, commission breakdown, totals.

### Empty State
- [ ] **No batches message** — If no payment batches exist, the message "No payment batches found." is shown.

### Loading State
- [ ] **Loading indicators** — While data is loading, pulsing grey placeholder elements are shown.

### Error State
- [ ] **Error message** — If the API fails, an error message is shown.

### Navigation
- [ ] **Accessible from nav** — The "Payments Made" link in the top navigation bar takes you to this page.
- [ ] **Pre-filtered from agency** — If navigated to with `?agencyName=RE/MAX`, the Agency Name filter is pre-filled.
