import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock recharts to avoid SVG rendering issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children, data }: { children: React.ReactNode; data: Array<{ name: string; count: number }> }) => (
    <div data-testid="bar-chart">{data?.map((d) => <span key={d.name}>{d.name}: {d.count}</span>)}{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

// Mock API endpoints
vi.mock("@/lib/api/endpoints", () => ({
  getDashboard: vi.fn(),
  getPayments: vi.fn(),
}));

import DashboardPage from "../page";
import { getDashboard, getPayments } from "@/lib/api/endpoints";
import type { PaymentsDashboardRead, PaymentReadList } from "@/types/api";

const mockGetDashboard = vi.mocked(getDashboard);
const mockGetPayments = vi.mocked(getPayments);

function createDashboardResponse(overrides?: Partial<PaymentsDashboardRead>): PaymentsDashboardRead {
  return {
    PaymentStatusReport: [
      { Status: "READY", PaymentCount: 15, TotalPaymentAmount: 1234567.89, CommissionType: "Bond Comm", AgencyName: "Agency One" },
      { Status: "READY", PaymentCount: 8, TotalPaymentAmount: 500000, CommissionType: "Manual Payments", AgencyName: "Agency One" },
      { Status: "PARKED", PaymentCount: 5, TotalPaymentAmount: 456789.12, CommissionType: "Bond Comm", AgencyName: "Agency One" },
      { Status: "PARKED", PaymentCount: 3, TotalPaymentAmount: 200000, CommissionType: "Manual Payments", AgencyName: "Agency One" },
      { Status: "READY", PaymentCount: 10, TotalPaymentAmount: 800000, CommissionType: "Bond Comm", AgencyName: "Agency Two" },
      { Status: "READY", PaymentCount: 5, TotalPaymentAmount: 300000, CommissionType: "Manual Payments", AgencyName: "Agency Two" },
    ],
    ParkedPaymentsAgingReport: [
      { Range: "1-3 days", AgencyName: "Agency One", PaymentCount: 10 },
      { Range: "4-7 days", AgencyName: "Agency One", PaymentCount: 6 },
      { Range: ">7 days", AgencyName: "Agency One", PaymentCount: 3 },
    ],
    TotalPaymentCountInLast14Days: 5,
    PaymentsByAgency: [
      { AgencyName: "Agency One", PaymentCount: 12, TotalCommissionAmount: 123456.78, Vat: 12345.68 },
      { AgencyName: "Agency Two", PaymentCount: 8, TotalCommissionAmount: 89012.34, Vat: 8901.23 },
      { AgencyName: "Agency Three", PaymentCount: 0, TotalCommissionAmount: 0, Vat: 0 },
    ],
    ...overrides,
  };
}

function createPaymentsResponse(): PaymentReadList {
  return {
    PaymentList: [
      {
        Id: 1, AgencyName: "Agency One", ClaimDate: "2026-03-30", AgentName: "Test", AgentSurname: "Agent",
        BondAmount: 1000000, CommissionType: "Bond Comm", CommissionPct: 1.0, GrantDate: "2026-03-25",
        RegistrationDate: "2026-03-28", Bank: "ABSA", CommissionAmount: 50000, VAT: 7500,
        Status: "REG", PaymentState: "PROCESSED", LastChangedDate: "2026-03-25", LastChangedUser: "System",
      },
      {
        Id: 2, AgencyName: "Agency One", ClaimDate: "2026-03-28", AgentName: "Another", AgentSurname: "Agent",
        BondAmount: 2000000, CommissionType: "Bond Comm", CommissionPct: 0.5, GrantDate: "2026-03-20",
        RegistrationDate: "2026-03-22", Bank: "FNB", CommissionAmount: 75000, VAT: 11250,
        Status: "REG", PaymentState: "PROCESSED", LastChangedDate: "2026-03-30", LastChangedUser: "System",
      },
      {
        Id: 3, AgencyName: "Agency One", ClaimDate: "2026-03-10", AgentName: "Old", AgentSurname: "Agent",
        BondAmount: 500000, CommissionType: "Bond Comm", CommissionPct: 0.8, GrantDate: "2026-03-01",
        RegistrationDate: "2026-03-05", Bank: "STD", CommissionAmount: 30000, VAT: 4500,
        Status: "REG", PaymentState: "PROCESSED", LastChangedDate: "2026-03-10", LastChangedUser: "System",
      },
      {
        Id: 4, AgencyName: "Agency One", ClaimDate: "2026-03-28", AgentName: "NotProc", AgentSurname: "Agent",
        BondAmount: 1500000, CommissionType: "Bond Comm", CommissionPct: 0.7, GrantDate: "2026-03-20",
        RegistrationDate: "2026-03-22", Bank: "NED", CommissionAmount: 20000, VAT: 3000,
        Status: "REG", PaymentState: "READY", LastChangedDate: "2026-03-28", LastChangedUser: "System",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDashboard.mockResolvedValue(createDashboardResponse());
  mockGetPayments.mockResolvedValue(createPaymentsResponse());
});

describe("Dashboard Page", () => {
  // Scenario 1: Dashboard displays "Payments Ready for Payment" bar chart
  it("displays Payments Ready for Payment bar chart with commission type split", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment")).toBeInTheDocument();
    });
    // Check that the chart shows Bond Comm and Manual Payments data
    expect(screen.getAllByText(/Bond Comm/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Manual Payments/).length).toBeGreaterThan(0);
  });

  // Scenario 2: Dashboard displays "Parked Payments" bar chart
  it("displays Parked Payments bar chart with commission type split", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Parked Payments")).toBeInTheDocument();
    });
  });

  // Scenario 3: "Total Value Ready for Payment" metric card
  it("displays Total Value Ready for Payment metric card in ZAR format", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Value Ready for Payment")).toBeInTheDocument();
    });
    // All READY amounts: 1234567.89 + 500000 + 800000 + 300000 = 2834567.89
    expect(screen.getByText("R 2 834 567,89")).toBeInTheDocument();
  });

  // Scenario 4: "Total Value of Parked Payments" metric card
  it("displays Total Value of Parked Payments metric card in ZAR format", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Total Value of Parked Payments")).toBeInTheDocument();
    });
    // All PARKED amounts: 456789.12 + 200000 = 656789.12
    expect(screen.getByText("R 656 789,12")).toBeInTheDocument();
  });

  // Scenario 5: Parked Payments Aging Report chart
  it("displays Parked Payments Aging Report chart with day ranges", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Parked Payments Aging Report")).toBeInTheDocument();
    });
    expect(screen.getByText(/1-3 days/)).toBeInTheDocument();
    expect(screen.getByText(/4-7 days/)).toBeInTheDocument();
    expect(screen.getByText(/>7 days/)).toBeInTheDocument();
  });

  // Scenario 7: Agency Summary grid with multiple agencies
  it("displays Agency Summary grid with all agencies including zero-payment ones", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Agency Summary")).toBeInTheDocument();
    });
    expect(screen.getByText("Agency One")).toBeInTheDocument();
    expect(screen.getByText("Agency Two")).toBeInTheDocument();
    expect(screen.getByText("Agency Three")).toBeInTheDocument();

    // Currency formatting in grid
    expect(screen.getByText("R 123 456,78")).toBeInTheDocument();
    expect(screen.getByText("R 12 345,68")).toBeInTheDocument();
  });

  // Scenario 8: Clicking "View" on an agency row navigates to Payment Management
  it("navigates to /payments?agencyName=... when View button is clicked", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Agency One")).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText("View");
    fireEvent.click(viewButtons[0]);

    expect(mockPush).toHaveBeenCalledWith("/payments?agencyName=Agency%20One");
  });

  // Scenario 9: Loading state while data is being fetched
  it("shows loading indicators while data is being fetched", () => {
    mockGetDashboard.mockReturnValue(new Promise(() => {})); // Never resolves
    mockGetPayments.mockReturnValue(new Promise(() => {}));

    render(<DashboardPage />);

    const loadingIndicators = screen.getAllByRole("status");
    expect(loadingIndicators.length).toBeGreaterThan(0);
  });

  // Scenario 10: Dashboard API failure shows error message
  it("shows error message when dashboard API fails", async () => {
    mockGetDashboard.mockRejectedValue(new Error("API error"));
    mockGetPayments.mockResolvedValue(createPaymentsResponse());

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard data/)).toBeInTheDocument();
    });
  });

  // Edge E1: Payments API failure while dashboard API succeeds (partial failure)
  it("shows error for 14-day metric when payments API fails, rest of dashboard still displays", async () => {
    mockGetDashboard.mockResolvedValue(createDashboardResponse());
    mockGetPayments.mockRejectedValue(new Error("API error"));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Agency Summary")).toBeInTheDocument();
    });
    expect(screen.getByText("Payments Ready for Payment")).toBeInTheDocument();
    expect(screen.getByText(/Failed to load payments data/)).toBeInTheDocument();
  });

  // Edge E2: API returns completely empty data
  it("shows empty state message when API returns no data", async () => {
    mockGetDashboard.mockResolvedValue({
      PaymentStatusReport: [],
      ParkedPaymentsAgingReport: [],
      TotalPaymentCountInLast14Days: 0,
      PaymentsByAgency: [],
    });
    mockGetPayments.mockResolvedValue({ PaymentList: [] });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  // Edge E3: ZAR formatting consistency
  it("formats all currency values in ZAR format consistently", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Agency Summary")).toBeInTheDocument();
    });
    // Zero value for Agency Three
    const zeroValues = screen.getAllByText("R 0,00");
    expect(zeroValues.length).toBeGreaterThanOrEqual(2); // commission + VAT for Agency Three
  });

  // Agency filtering: clicking agency row updates URL
  it("updates URL with agencyId when agency row is clicked", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Agency One")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Agency One"));
    expect(mockPush).toHaveBeenCalledWith("/?agencyId=Agency%20One", { scroll: false });
  });

  // Agency filtering: metrics update when agency is selected
  it("filters metrics when an agency is selected", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Agency Summary")).toBeInTheDocument();
    });

    // Click Agency One to filter
    fireEvent.click(screen.getByText("Agency One"));

    // After filtering, Total Value Ready should only show Agency One values
    // Agency One READY: 1234567.89 + 500000 = 1734567.89
    await waitFor(() => {
      expect(screen.getByText("R 1 734 567,89")).toBeInTheDocument();
    });
  });

  // Selected row is visually highlighted
  it("visually highlights the selected agency row", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Agency One")).toBeInTheDocument();
    });

    const agencyOneRow = screen.getByText("Agency One").closest("tr");
    fireEvent.click(agencyOneRow!);

    expect(agencyOneRow).toHaveAttribute("aria-selected", "true");
  });
});
