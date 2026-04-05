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
  getPaymentBatches: vi.fn(),
  downloadInvoicePdf: vi.fn(),
}));

import PaymentsMadePage from "../payments-made/page";
import { getPaymentBatches, downloadInvoicePdf } from "@/lib/api/endpoints";
import type { PaymentBatchReadList } from "@/types/api";

const mockGetPaymentBatches = vi.mocked(getPaymentBatches);
const mockDownloadInvoicePdf = vi.mocked(downloadInvoicePdf);

function createBatchesData(): PaymentBatchReadList {
  return {
    PaymentBatchList: [
      {
        Id: 1, Reference: "BB202511-391", AgencyName: "Chas Everitt",
        CreatedDate: "2025-11-06", Status: "PROCESSED", LastChangedUser: "System",
        PaymentCount: 1, TotalCommissionAmount: 20123.25, TotalVat: 3018.49,
      },
      {
        Id: 2, Reference: "BB202511-165", AgencyName: "RE/MAX",
        CreatedDate: "2025-11-06", Status: "PROCESSED", LastChangedUser: "System",
        PaymentCount: 1, TotalCommissionAmount: 13013.34, TotalVat: 1952.00,
      },
      {
        Id: 3, Reference: "BB202511-752", AgencyName: "Seeff",
        CreatedDate: "2025-11-09", Status: "PROCESSED", LastChangedUser: "System",
        PaymentCount: 1, TotalCommissionAmount: 5643.58, TotalVat: 846.54,
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPaymentBatches.mockResolvedValue(createBatchesData());
  mockDownloadInvoicePdf.mockResolvedValue(new Blob(["test"]));
});

describe("Payments Made Page", () => {
  // Displays all processed payment batches
  it("displays all processed payment batches", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Processed Payment Batches (3)")).toBeInTheDocument();
    });
    expect(screen.getByText("BB202511-391")).toBeInTheDocument();
    expect(screen.getByText("BB202511-165")).toBeInTheDocument();
    expect(screen.getByText("BB202511-752")).toBeInTheDocument();
  });

  // Displays batch details
  it("displays batch details including agency, date, and amounts", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Chas Everitt")).toBeInTheDocument();
    });
    expect(screen.getByText("RE/MAX")).toBeInTheDocument();
    expect(screen.getByText("Seeff")).toBeInTheDocument();
    expect(screen.getByText("R 20 123,25")).toBeInTheDocument();
    expect(screen.getByText("R 3 018,49")).toBeInTheDocument();
  });

  // Filter by agency name
  it("filters batches by agency name", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Processed Payment Batches (3)")).toBeInTheDocument();
    });

    const agencyInput = screen.getByPlaceholderText("Filter by agency...");
    fireEvent.change(agencyInput, { target: { value: "RE/MAX" } });

    expect(screen.getByText("Processed Payment Batches (1)")).toBeInTheDocument();
    expect(screen.getByText("BB202511-165")).toBeInTheDocument();
    expect(screen.queryByText("BB202511-391")).not.toBeInTheDocument();
  });

  // Filter by batch reference
  it("filters batches by reference", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Processed Payment Batches (3)")).toBeInTheDocument();
    });

    const refInput = screen.getByPlaceholderText("Filter by reference...");
    fireEvent.change(refInput, { target: { value: "752" } });

    expect(screen.getByText("Processed Payment Batches (1)")).toBeInTheDocument();
    expect(screen.getByText("BB202511-752")).toBeInTheDocument();
  });

  // Download invoice button exists
  it("has Download Invoice button for each batch", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Processed Payment Batches (3)")).toBeInTheDocument();
    });
    const downloadButtons = screen.getAllByText("Download Invoice");
    expect(downloadButtons).toHaveLength(3);
  });

  // Invoice download triggers
  it("triggers invoice download when button is clicked", async () => {
    // Mock URL.createObjectURL
    const mockUrl = "blob:test";
    global.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    global.URL.revokeObjectURL = vi.fn();

    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Processed Payment Batches (3)")).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByText("Download Invoice");
    fireEvent.click(downloadButtons[0]);

    await waitFor(() => {
      expect(mockDownloadInvoicePdf).toHaveBeenCalledWith(1);
    });
  });

  // Status badge shows PROCESSED
  it("displays PROCESSED status badges", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      const processedBadges = screen.getAllByText("PROCESSED");
      expect(processedBadges.length).toBe(3);
    });
  });

  // Clear filters button
  it("clears all filters when Clear Filters is clicked", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Processed Payment Batches (3)")).toBeInTheDocument();
    });

    const agencyInput = screen.getByPlaceholderText("Filter by agency...");
    fireEvent.change(agencyInput, { target: { value: "RE/MAX" } });
    expect(screen.getByText("Processed Payment Batches (1)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear Filters"));
    expect(screen.getByText("Processed Payment Batches (3)")).toBeInTheDocument();
  });

  // Empty state
  it("shows empty message when no batches are found", async () => {
    mockGetPaymentBatches.mockResolvedValue({ PaymentBatchList: [] });
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("No payment batches found.")).toBeInTheDocument();
    });
  });

  // Loading state
  it("shows loading state while fetching batches", () => {
    mockGetPaymentBatches.mockReturnValue(new Promise(() => {}));
    render(<PaymentsMadePage />);
    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  // Error state
  it("shows error when batches fail to load", async () => {
    mockGetPaymentBatches.mockRejectedValue(new Error("API error"));
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load payment batches.")).toBeInTheDocument();
    });
  });

  // Currency formatting in grid
  it("formats all currency values in ZAR format", async () => {
    render(<PaymentsMadePage />);
    await waitFor(() => {
      expect(screen.getByText("R 13 013,34")).toBeInTheDocument();
    });
    expect(screen.getByText("R 1 952,00")).toBeInTheDocument();
    expect(screen.getByText("R 5 643,58")).toBeInTheDocument();
    expect(screen.getByText("R 846,54")).toBeInTheDocument();
  });
});
