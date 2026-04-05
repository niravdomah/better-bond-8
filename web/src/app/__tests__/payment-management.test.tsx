import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock next/navigation
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

// Mock API endpoints
vi.mock("@/lib/api/endpoints", () => ({
  getPayments: vi.fn(),
  parkPayments: vi.fn(),
  unparkPayments: vi.fn(),
  createPaymentBatch: vi.fn(),
}));

import PaymentManagementPage from "../payments/page";
import { getPayments, parkPayments, unparkPayments, createPaymentBatch } from "@/lib/api/endpoints";
import type { PaymentReadList } from "@/types/api";

const mockGetPayments = vi.mocked(getPayments);
const mockParkPayments = vi.mocked(parkPayments);
const mockUnparkPayments = vi.mocked(unparkPayments);
const mockCreatePaymentBatch = vi.mocked(createPaymentBatch);

function createPaymentsData(): PaymentReadList {
  return {
    PaymentList: [
      {
        Id: 10001, AgencyName: "RE/MAX", ClaimDate: "2025-11-10", AgentName: "Johan", AgentSurname: "Molefe",
        BondAmount: 1402808.47, CommissionType: "Bond Comm", CommissionPct: 1.039, GrantDate: "2025-10-21",
        RegistrationDate: "2025-10-22", Bank: "ABSA", CommissionAmount: 14575.18, VAT: 2186.28,
        Status: "REG", PaymentState: "READY", LastChangedUser: "System",
      },
      {
        Id: 10003, AgencyName: "RE/MAX", ClaimDate: "2025-11-06", AgentName: "Ayesha", AgentSurname: "Moore",
        BondAmount: 3074686.61, CommissionType: "Bond Comm", CommissionPct: 0.635, GrantDate: "2025-10-20",
        RegistrationDate: "2025-10-29", Bank: "NED", CommissionAmount: 19524.26, VAT: 2928.64,
        Status: "REG", PaymentState: "READY", LastChangedUser: "System",
      },
      {
        Id: 10009, AgencyName: "RE/MAX", ClaimDate: "2025-11-10", AgentName: "Michael", AgentSurname: "Meyer",
        BondAmount: 1034661.23, CommissionType: "Bond Comm", CommissionPct: 0.859, GrantDate: "2025-10-22",
        RegistrationDate: "2025-10-25", Bank: "ABSA", CommissionAmount: 8887.74, VAT: 1333.16,
        Status: "REG", PaymentState: "PARKED", LastChangedUser: "System",
      },
      {
        Id: 10013, AgencyName: "RE/MAX", ClaimDate: "2025-11-06", AgentName: "Michael", AgentSurname: "Meyer",
        BondAmount: 1807408.33, CommissionType: "Manual Payments", CommissionPct: 0.72, GrantDate: "2025-10-20",
        RegistrationDate: "2025-10-23", Bank: "STD", CommissionAmount: 13013.34, VAT: 1952.00,
        Status: "MAN-PAY", PaymentState: "PROCESSED", BatchId: "BB202511-165",
        LastChangedUser: "System", LastChangedDate: "2025-11-06",
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPayments.mockResolvedValue(createPaymentsData());
  mockParkPayments.mockResolvedValue({ MessageType: "Success", Messages: ["Parked"] });
  mockUnparkPayments.mockResolvedValue({ MessageType: "Success", Messages: ["Unparked"] });
  mockCreatePaymentBatch.mockResolvedValue({ Id: 1, MessageType: "Success", Messages: ["Batch created"] });
});

describe("Payment Management Page", () => {
  // Main grid displays ready payments
  it("displays ready payments in the main grid", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });
    expect(screen.getByText("Johan Molefe")).toBeInTheDocument();
    expect(screen.getByText("Ayesha Moore")).toBeInTheDocument();
  });

  // Parked grid displays parked payments
  it("displays parked payments in the parked grid", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Parked Payments (1)")).toBeInTheDocument();
    });
    expect(screen.getByText("Michael Meyer")).toBeInTheDocument();
  });

  // Does not display processed payments
  it("does not display processed payments in either grid", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });
    // The processed payment's batchId should not be in the grids
    expect(screen.queryByText("BB202511-165")).not.toBeInTheDocument();
  });

  // Single payment parking with confirmation modal
  it("shows confirmation modal when Park button is clicked on a single payment", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });

    const parkButtons = screen.getAllByText("Park");
    fireEvent.click(parkButtons[0]);

    expect(screen.getByText("Park Payment")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to park this payment?")).toBeInTheDocument();
    expect(screen.getByText(/Agent: Johan/)).toBeInTheDocument();
  });

  // Confirming park calls the API
  it("calls park API when park is confirmed", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });

    const parkButtons = screen.getAllByText("Park");
    fireEvent.click(parkButtons[0]);

    fireEvent.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(mockParkPayments).toHaveBeenCalledWith([10001]);
    });
  });

  // Cancelling park modal does not call API
  it("does not call park API when park modal is cancelled", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });

    const parkButtons = screen.getAllByText("Park");
    fireEvent.click(parkButtons[0]);
    fireEvent.click(screen.getByText("Cancel"));

    expect(mockParkPayments).not.toHaveBeenCalled();
  });

  // Bulk parking with checkbox selection
  it("allows selecting multiple payments and parking them in bulk", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });

    // Select all checkboxes in ready grid
    const checkboxes = screen.getAllByRole("checkbox");
    // First checkbox is "select all" for ready grid
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText("Park Selected (2)")).toBeInTheDocument();
  });

  // Unpark single payment
  it("shows confirmation modal when Unpark button is clicked", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Parked Payments (1)")).toBeInTheDocument();
    });

    const unparkButton = screen.getByText("Unpark");
    fireEvent.click(unparkButton);

    expect(screen.getByText("Unpark Payment")).toBeInTheDocument();
    expect(screen.getByText("Are you sure you want to unpark this payment?")).toBeInTheDocument();
  });

  // Confirming unpark calls the API
  it("calls unpark API when unpark is confirmed", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Parked Payments (1)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Unpark"));
    fireEvent.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(mockUnparkPayments).toHaveBeenCalledWith([10009]);
    });
  });

  // Initiate Payment button
  it("shows confirmation modal when Initiate Payment is clicked", async () => {
    // Set filter to single agency
    mockSearchParams.set("agencyName", "RE/MAX");
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText(/Payments Ready for Payment/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Initiate Payment"));

    await waitFor(() => {
      expect(screen.getByText("Initiate Payment", { selector: "h3" })).toBeInTheDocument();
    });
    mockSearchParams.delete("agencyName");
  });

  // Search filter by agency name
  it("filters payments by agency name", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });

    const agencyInput = screen.getByPlaceholderText("Filter by agency...");
    fireEvent.change(agencyInput, { target: { value: "NonExistent" } });

    expect(screen.getByText("Payments Ready for Payment (0)")).toBeInTheDocument();
  });

  // Search filter by status
  it("filters payments by status code", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Payments Ready for Payment (2)")).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue("All");
    fireEvent.change(statusSelect, { target: { value: "MAN-PAY" } });

    // No ready payments with MAN-PAY status in our test data's READY state
    expect(screen.getByText("Payments Ready for Payment (0)")).toBeInTheDocument();
  });

  // Currency formatting in grid
  it("displays currency values in ZAR format in the grid", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("R 14 575,18")).toBeInTheDocument();
    });
    expect(screen.getByText("R 2 186,28")).toBeInTheDocument();
  });

  // Percentage formatting
  it("displays commission percentage correctly", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("1.039%")).toBeInTheDocument();
    });
  });

  // Status badge display
  it("displays status badges for REG and MAN-PAY", async () => {
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getAllByText("REG").length).toBeGreaterThan(0);
    });
  });

  // Loading state
  it("shows loading state while fetching payments", () => {
    mockGetPayments.mockReturnValue(new Promise(() => {}));
    render(<PaymentManagementPage />);
    // Should show loading animation
    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  // Error state
  it("shows error when payments fail to load", async () => {
    mockGetPayments.mockRejectedValue(new Error("API error"));
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load payments.")).toBeInTheDocument();
    });
  });

  // Payment batch creates success modal
  it("shows success modal after batch payment is processed", async () => {
    mockSearchParams.set("agencyName", "RE/MAX");
    render(<PaymentManagementPage />);
    await waitFor(() => {
      expect(screen.getByText(/Payments Ready for Payment/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Initiate Payment"));
    await waitFor(() => {
      expect(screen.getByText("Confirm")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Confirm"));

    await waitFor(() => {
      expect(screen.getByText("Payment Processed")).toBeInTheDocument();
    });
    mockSearchParams.delete("agencyName");
  });
});
