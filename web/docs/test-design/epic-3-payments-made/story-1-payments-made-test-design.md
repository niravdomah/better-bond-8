# Test Design: Payments Made Screen

## Story Summary

**Epic:** 3
**Story:** 1
**As a** user of the BetterBond Commission Payments system
**I want to** view all processed payment batches and download their invoices
**So that** I can track completed payments and access invoice documentation.

## Business Behaviors Identified

- **B1: Grid displays all processed batches** — All payment batches with status PROCESSED are shown.
- **B2: Batch details displayed** — Reference, Agency Name, Created Date, Payment Count, Total Commission, VAT, Status are visible.
- **B3: Filter by agency name** — Typing agency name filters the list (case-insensitive partial match).
- **B4: Filter by reference** — Typing batch reference filters the list.
- **B5: Download Invoice button** — Each batch has a "Download Invoice" button.
- **B6: Invoice download triggers** — Clicking download calls the API and triggers file download.
- **B7: PROCESSED status badge** — Each row shows green "PROCESSED" badge.
- **B8: Clear Filters** — Clicking "Clear Filters" resets all filters.
- **B9: Empty state** — "No payment batches found." message when no batches exist.
- **B10: Loading state** — Pulsing placeholders while loading.
- **B11: Error state** — Error message when API fails.
- **B12: Currency formatting** — All amounts use ZAR format (R X XXX,XX).

## Test Scenarios

### 1. Displays all processed payment batches

| Setup | API returns 3 batches (Chas Everitt, RE/MAX, Seeff) |
| Expected | Grid shows "Processed Payment Batches (3)" with all 3 references |

**Test:** "displays all processed payment batches"

---

### 2. Displays batch details

| Expected | Agency names, commission amounts, VAT all visible in correct format |

**Test:** "displays batch details including agency, date, and amounts"

---

### 3. Filter by agency name

| Input | Type "RE/MAX" in agency filter |
| Expected | Only BB202511-165 visible, count shows 1 |

**Test:** "filters batches by agency name"

---

### 4. Filter by reference

| Input | Type "752" in reference filter |
| Expected | Only BB202511-752 visible, count shows 1 |

**Test:** "filters batches by reference"

---

### 5. Download Invoice buttons exist

| Expected | 3 "Download Invoice" buttons, one per batch |

**Test:** "has Download Invoice button for each batch"

---

### 6. Invoice download triggers API call

| Input | Click first "Download Invoice" button |
| Expected | downloadInvoicePdf called with batch ID 1 |

**Test:** "triggers invoice download when button is clicked"

---

### 7. PROCESSED status badges

| Expected | All 3 rows show "PROCESSED" badge |

**Test:** "displays PROCESSED status badges"

---

### 8. Clear Filters

| Setup | Filter by agency, then click Clear Filters |
| Expected | Count returns to 3, all batches visible |

**Test:** "clears all filters when Clear Filters is clicked"

---

### 9-11. Empty, loading, and error states

**Tests:** "shows empty message when no batches are found", "shows loading state while fetching batches", "shows error when batches fail to load"

---

### 12. Currency formatting

| Expected | All commission and VAT amounts use R X XXX,XX format |

**Test:** "formats all currency values in ZAR format"

## Coverage Summary

All 12 behaviors are covered by automated tests in `src/app/__tests__/payments-made.test.tsx`.
