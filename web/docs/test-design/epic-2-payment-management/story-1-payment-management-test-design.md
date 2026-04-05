# Test Design: Payment Management Screen

## Story Summary

**Epic:** 2
**Story:** 1
**As a** commission payments administrator
**I want to** view, park, unpark, and batch-process commission payments
**So that** I can manage the payment workflow for each agency.

## Business Behaviors Identified

- **B1: Main grid shows READY payments** — Only payments with state "READY" appear in the main grid.
- **B2: Parked grid shows PARKED payments** — Only parked payments appear in the parked grid.
- **B3: Processed payments excluded** — PROCESSED payments do not appear in either grid.
- **B4: Single park confirmation** — Clicking "Park" on a single payment shows a confirmation modal with Agent Name, Claim Date, and Amount.
- **B5: Confirm park calls API** — Confirming the park modal sends the payment ID to the park API.
- **B6: Cancel park closes modal** — Cancelling the park modal does not call the API.
- **B7: Bulk park selection** — Selecting multiple checkboxes enables the "Park Selected" button with count.
- **B8: Single unpark confirmation** — Clicking "Unpark" shows confirmation modal with details.
- **B9: Confirm unpark calls API** — Confirming the unpark modal sends the payment ID to the unpark API.
- **B10: Initiate Payment** — Initiating payment shows confirmation with count and total value.
- **B11: Batch success modal** — After successful batch processing, a "Payment Processed" success modal appears.
- **B12: Filter by agency** — Agency name filter narrows both grids.
- **B13: Filter by status** — Status dropdown filters by REG or MAN-PAY.
- **B14: Currency formatting** — All amounts use ZAR format (R X XXX,XX).
- **B15: Percentage formatting** — Commission % displays correctly (e.g., 1.039%).
- **B16: Status badges** — REG and MAN-PAY have distinct visual badges.
- **B17: Loading state** — Pulsing placeholders show while data loads.
- **B18: Error state** — Error message when API fails.

## Test Scenarios

### 1. Main grid displays ready payments

| Setup | API returns 2 READY, 1 PARKED, 1 PROCESSED payment |
| Expected | Main grid shows count of 2, both READY payments visible |

**Test:** "displays ready payments in the main grid"

---

### 2. Parked grid displays parked payments

| Expected | Parked grid shows count of 1, the PARKED payment visible |

**Test:** "displays parked payments in the parked grid"

---

### 3. Processed payments excluded

| Expected | No PROCESSED payment data (batchId) appears in either grid |

**Test:** "does not display processed payments in either grid"

---

### 4. Single park confirmation modal

| Input | Click "Park" on first ready payment |
| Expected | Modal shows "Park Payment", "Are you sure...", agent details |

**Test:** "shows confirmation modal when Park button is clicked on a single payment"

---

### 5. Confirm park calls API

| Input | Click "Park", then click "Confirm" |
| Expected | parkPayments called with [10001] |

**Test:** "calls park API when park is confirmed"

---

### 6. Cancel park does not call API

| Input | Click "Park", then click "Cancel" |
| Expected | parkPayments not called |

**Test:** "does not call park API when park modal is cancelled"

---

### 7. Bulk park selection

| Input | Click "select all" checkbox in ready grid |
| Expected | "Park Selected (2)" button appears |

**Test:** "allows selecting multiple payments and parking them in bulk"

---

### 8. Unpark confirmation modal

| Input | Click "Unpark" on a parked payment |
| Expected | Modal shows "Unpark Payment", "Are you sure..." |

**Test:** "shows confirmation modal when Unpark button is clicked"

---

### 9. Confirm unpark calls API

| Input | Click "Unpark", then click "Confirm" |
| Expected | unparkPayments called with [10009] |

**Test:** "calls unpark API when unpark is confirmed"

---

### 10. Initiate Payment

| Input | Click "Initiate Payment" with agency filter set |
| Expected | Confirmation modal with payment count and total |

**Test:** "shows confirmation modal when Initiate Payment is clicked"

---

### 11. Filter by agency name

| Input | Type "NonExistent" in agency filter |
| Expected | Ready count changes to 0 |

**Test:** "filters payments by agency name"

---

### 12. Filter by status

| Input | Select "MAN-PAY" from status dropdown |
| Expected | Ready count changes based on matching status |

**Test:** "filters payments by status code"

---

### 13-16. Formatting and display

**Tests:** "displays currency values in ZAR format", "displays commission percentage correctly", "displays status badges"

---

### 17-18. Loading and error states

**Tests:** "shows loading state while fetching payments", "shows error when payments fail to load"

---

### 19. Batch success modal

**Test:** "shows success modal after batch payment is processed"

## Coverage Summary

All 19 behaviors are covered by automated tests in `src/app/__tests__/payment-management.test.tsx`.
