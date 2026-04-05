# Test Design: Dashboard with Charts, Metrics, and Agency Summary Grid

## Story Summary

**Epic:** 1
**Story:** 1
**As a** user of the BetterBond Commission Payments system
**I want to** see a Dashboard with charts, metrics, and an agency summary grid when I open the application
**So that** I can quickly understand the current state of commission payments across agencies at a glance.

## Business Behaviors Identified

- **B1: "Payments Ready for Payment" bar chart** — The dashboard displays a bar chart showing payment counts split by commission type (Bond Comm and Manual Payments).
- **B2: "Parked Payments" bar chart** — A second bar chart shows parked payment counts split by commission type.
- **B3: "Total Value Ready for Payment" metric card** — A metric card displays the sum of commission amounts for READY payments, formatted in ZAR.
- **B4: "Total Value of Parked Payments" metric card** — A metric card displays the sum of commission amounts for PARKED payments, formatted in ZAR.
- **B5: "Parked Payments Aging Report" chart** — A chart displays parked payment counts grouped into aging ranges: 1-3 days, 4-7 days, and more than 7 days.
- **B6: "Payments Made (Last 14 Days)" metric** — A metric card displays the total value of recently processed payments.
- **B7: Agency Summary grid** — A data table shows one row per agency with columns: Agency Name, Number of Payments, Total Commission Amount (ZAR), VAT (ZAR).
- **B8: Agency "View" button navigation** — Each agency row has a "View" button that navigates to Payment Management for that agency.
- **B9: ZAR currency formatting** — All currency values use R X XXX XXX,XX format.
- **B10: Loading states** — Loading indicators appear while data is being fetched.
- **B11: Error handling** — When the dashboard API fails, an error message is shown.
- **B12: Partial failure** — When the payments API fails, only the 14-day metric shows an error; rest of dashboard displays.
- **B13: Empty state** — When API returns no data, an empty state message is shown.
- **B14: Agency filtering** — Clicking an agency row filters all charts and metrics to that agency.
- **B15: URL reflects selection** — The URL updates with agencyId when an agency is selected.

## Test Scenarios

### 1. Dashboard displays "Payments Ready for Payment" bar chart

| Setup | Value |
| --- | --- |
| Dashboard API returns | PaymentStatusReport with READY entries for Bond Comm (15) and Manual Payments (8) |

| Expected | Value |
| --- | --- |
| Bar chart visible | Yes — titled "Payments Ready for Payment" |
| Bars shown | Two bars: Bond Comm (15) and Manual Payments (8) |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "displays Payments Ready for Payment bar chart with commission type split"

---

### 2. Dashboard displays "Parked Payments" bar chart

| Setup | Value |
| --- | --- |
| Dashboard API returns | PaymentStatusReport with PARKED entries for Bond Comm (5) and Manual Payments (3) |

| Expected | Value |
| --- | --- |
| Bar chart visible | Yes — titled "Parked Payments" |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "displays Parked Payments bar chart with commission type split"

---

### 3. "Total Value Ready for Payment" metric card

| Setup | Value |
| --- | --- |
| Dashboard API returns | READY entries totaling 2,834,567.89 |

| Expected | Value |
| --- | --- |
| Metric card visible | Yes — titled "Total Value Ready for Payment" |
| Displayed value | R 2 834 567,89 |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "displays Total Value Ready for Payment metric card in ZAR format"

---

### 4. "Total Value of Parked Payments" metric card

| Setup | Value |
| --- | --- |
| Dashboard API returns | PARKED entries totaling 656,789.12 |

| Expected | Value |
| --- | --- |
| Metric card visible | Yes — titled "Total Value of Parked Payments" |
| Displayed value | R 656 789,12 |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "displays Total Value of Parked Payments metric card in ZAR format"

---

### 5. Parked Payments Aging Report chart

| Setup | Value |
| --- | --- |
| Dashboard API returns | ParkedPaymentsAgingReport: 1-3 days (10), 4-7 days (6), >7 days (3) |

| Expected | Value |
| --- | --- |
| Aging chart visible | Yes — titled "Parked Payments Aging Report" |
| Ranges displayed | 1-3 days, 4-7 days, >7 days |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "displays Parked Payments Aging Report chart with day ranges"

---

### 6. Agency Summary grid with multiple agencies

| Setup | Value |
| --- | --- |
| Dashboard API returns | 3 agencies including one with zero payments |

| Expected | Value |
| --- | --- |
| Grid visible | Yes — titled "Agency Summary" |
| Row count | 3 rows including zero-payment agency |
| Each row has "View" button | Yes |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "displays Agency Summary grid with all agencies including zero-payment ones"

---

### 7. Clicking "View" navigates to Payment Management

| Input | Clicks "View" on Agency One row |
| Expected | router.push called with /payments?agencyName=Agency%20One |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "navigates to /payments?agencyName=... when View button is clicked"

---

### 8-10. Loading, error, and empty states

**Test file:** `src/app/__tests__/dashboard.test.tsx` — tests: "shows loading indicators", "shows error message when dashboard API fails", "shows empty state message"

---

### 11. Partial failure

| Setup | Dashboard succeeds, Payments fails |
| Expected | Dashboard displays normally, 14-day metric shows error |

**Test file:** `src/app/__tests__/dashboard.test.tsx` — test: "shows error for 14-day metric when payments API fails"

---

### 12-14. Agency filtering

**Test file:** `src/app/__tests__/dashboard.test.tsx` — tests: "updates URL with agencyId", "filters metrics when agency is selected", "visually highlights the selected agency row"

## Coverage Summary

| Test | Behavior | Status |
| --- | --- | --- |
| Bar chart ready | B1 | Covered |
| Bar chart parked | B2 | Covered |
| Metric ready value | B3 | Covered |
| Metric parked value | B4 | Covered |
| Aging report | B5 | Covered |
| Agency grid | B7 | Covered |
| View navigation | B8 | Covered |
| ZAR formatting | B9 | Covered |
| Loading states | B10 | Covered |
| Error handling | B11 | Covered |
| Partial failure | B12 | Covered |
| Empty state | B13 | Covered |
| Agency filtering | B14, B15 | Covered |
