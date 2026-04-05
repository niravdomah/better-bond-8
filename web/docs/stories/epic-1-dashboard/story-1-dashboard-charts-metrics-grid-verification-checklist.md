# Manual Verification Checklist — Dashboard Charts, Metrics, and Agency Summary Grid

**Epic:** 1 (Dashboard) | **Story:** 1 | **Route:** http://localhost:3000

## Pre-requisites
- The dev server is running (`npm run dev` from `web/`)
- The database has been seeded (`npx prisma db seed` from `web/`)

## Checks

### Charts
- [ ] **Payments Ready for Payment chart** — You see a bar chart titled "Payments Ready for Payment" with bars grouped by commission type (Bond Comm and Manual Payments).
- [ ] **Parked Payments chart** — You see a bar chart titled "Parked Payments" with bars grouped by commission type (Bond Comm and Manual Payments).
- [ ] **Parked Payments Aging Report** — You see a chart titled "Parked Payments Aging Report" showing aging ranges: 1-3 days, 4-7 days, and more than 7 days.

### Metric Cards
- [ ] **Total Value Ready for Payment** — You see a card titled "Total Value Ready for Payment" displaying a Rand amount (e.g., R 1 234 567,89) with space as thousands separator and comma as decimal.
- [ ] **Total Value of Parked Payments** — You see a card titled "Total Value of Parked Payments" displaying a Rand amount in the same format.
- [ ] **Payments Made (Last 14 Days)** — You see a card titled "Payments Made (Last 14 Days)" displaying a Rand amount. This value is calculated from recent processed payments.

### Agency Summary Grid
- [ ] **Grid displays** — Below the charts and metrics, you see an "Agency Summary" table with columns: Agency Name, Number of Payments, Total Commission Amount, VAT, and Actions.
- [ ] **All agencies shown** — Every agency from the database appears in the grid, including agencies with zero payments.
- [ ] **Currency formatting** — All Rand amounts in the grid use the format R X XXX XXX,XX (space separators, comma decimal).
- [ ] **View buttons** — Each agency row has a "View" button.
- [ ] **View navigation** — Clicking a "View" button takes you to /payments?agencyName=... with that agency pre-filtered.

### Loading and Error States
- [ ] **Loading indicators** — When the page first loads (or if you throttle the network), you briefly see placeholder loading indicators (grey pulsing rectangles) instead of charts and data.
- [ ] **Dashboard error** — If the API is unreachable (stop the backend), refreshing the page shows an error message saying data could not be loaded.

### Empty State
- [ ] **No data message** — If the database is empty, you see a message "No data available" instead of blank charts and an empty grid.

### Agency Filtering
- [ ] **Click agency to filter** — Click on an agency row in the Agency Summary grid. All charts and metrics update to show only that agency's data. The clicked row is visually highlighted.
- [ ] **URL updates** — After clicking an agency, the URL changes to `/?agencyId=AgencyName`.
- [ ] **Deselect agency** — Click the same highlighted agency row again. Charts and metrics return to the combined all-agency view. The URL returns to `/`.
- [ ] **Switch selection** — Click one agency, then click a different agency. Selection switches to the new agency. Metrics update accordingly.
- [ ] **Direct URL navigation** — Navigate directly to `/?agencyId=RE%2FMAX`. The page loads with that agency pre-selected.
- [ ] **Invalid agency in URL** — Navigate to `/?agencyId=NonExistentAgency`. The page loads normally showing all-agency data.
