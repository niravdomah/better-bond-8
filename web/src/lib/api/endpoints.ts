import type {
  PaymentReadList,
  PaymentRead,
  PaymentBatchReadList,
  PaymentBatchRead,
  PaymentsDashboardRead,
  DefaultResponse,
} from "@/types/api";

const API_BASE = "/api/v1";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Payments
export async function getPayments(params?: {
  ClaimDate?: string;
  AgencyName?: string;
  Status?: string;
}): Promise<PaymentReadList> {
  const searchParams = new URLSearchParams();
  if (params?.ClaimDate) searchParams.set("ClaimDate", params.ClaimDate);
  if (params?.AgencyName) searchParams.set("AgencyName", params.AgencyName);
  if (params?.Status) searchParams.set("Status", params.Status);
  const qs = searchParams.toString();
  return fetchJson<PaymentReadList>(`${API_BASE}/payments${qs ? `?${qs}` : ""}`);
}

export async function getPaymentById(id: number): Promise<PaymentRead> {
  return fetchJson<PaymentRead>(`${API_BASE}/payments/${id}`);
}

// Dashboard
export async function getDashboard(): Promise<PaymentsDashboardRead> {
  return fetchJson<PaymentsDashboardRead>(`${API_BASE}/payments/dashboard`);
}

// Park / Unpark
export async function parkPayments(paymentIds: number[]): Promise<DefaultResponse> {
  return fetchJson<DefaultResponse>(`${API_BASE}/payments/park`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ PaymentIds: paymentIds }),
  });
}

export async function unparkPayments(paymentIds: number[]): Promise<DefaultResponse> {
  return fetchJson<DefaultResponse>(`${API_BASE}/payments/unpark`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ PaymentIds: paymentIds }),
  });
}

// Payment Batches
export async function getPaymentBatches(params?: {
  Reference?: string;
  AgencyName?: string;
}): Promise<PaymentBatchReadList> {
  const searchParams = new URLSearchParams();
  if (params?.Reference) searchParams.set("Reference", params.Reference);
  if (params?.AgencyName) searchParams.set("AgencyName", params.AgencyName);
  const qs = searchParams.toString();
  return fetchJson<PaymentBatchReadList>(
    `${API_BASE}/payment-batches${qs ? `?${qs}` : ""}`
  );
}

export async function getPaymentBatchById(id: number): Promise<PaymentBatchRead> {
  return fetchJson<PaymentBatchRead>(`${API_BASE}/payment-batches/${id}`);
}

export async function createPaymentBatch(
  paymentIds: number[],
  lastChangedUser: string = "System"
): Promise<DefaultResponse> {
  return fetchJson<DefaultResponse>(`${API_BASE}/payment-batches`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      LastChangedUser: lastChangedUser,
    },
    body: JSON.stringify({ PaymentIds: paymentIds }),
  });
}

export async function downloadInvoicePdf(batchId: number): Promise<Blob> {
  const res = await fetch(`${API_BASE}/payment-batches/${batchId}/download-invoice-pdf`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to download invoice");
  return res.blob();
}

// Demo
export async function resetDemo(): Promise<DefaultResponse> {
  return fetchJson<DefaultResponse>("/api/demo/reset-demo", { method: "POST" });
}
