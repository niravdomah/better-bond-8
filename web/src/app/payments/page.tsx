"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPayments,
  parkPayments,
  unparkPayments,
  createPaymentBatch,
} from "@/lib/api/endpoints";
import { formatCurrency, formatPercentage } from "@/lib/utils/formatting";
import type { PaymentRead } from "@/types/api";

function ConfirmModal({
  title,
  message,
  details,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        {details && details.length > 0 && (
          <ul className="text-sm text-gray-500 mb-4 space-y-1">
            {details.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessModal({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-green-700 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentManagementContent() {
  const searchParams = useSearchParams();
  const agencyNameParam = searchParams.get("agencyName");

  const [allPayments, setAllPayments] = useState<PaymentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReady, setSelectedReady] = useState<Set<number>>(new Set());
  const [selectedParked, setSelectedParked] = useState<Set<number>>(new Set());

  // Search filters
  const [filterClaimDate, setFilterClaimDate] = useState("");
  const [filterAgencyName, setFilterAgencyName] = useState(agencyNameParam || "");
  const [filterStatus, setFilterStatus] = useState("");

  // Modal state
  const [modal, setModal] = useState<{
    type: "park" | "unpark" | "batch" | "success";
    paymentIds?: number[];
    message?: string;
    details?: string[];
    title?: string;
  } | null>(null);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPayments();
      setAllPayments(data.PaymentList);
    } catch {
      setError("Failed to load payments.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // Filter payments
  const readyPayments = allPayments.filter((p) => {
    if (p.PaymentState !== "READY") return false;
    if (filterClaimDate && p.ClaimDate !== filterClaimDate) return false;
    if (filterAgencyName && !p.AgencyName.toLowerCase().includes(filterAgencyName.toLowerCase())) return false;
    if (filterStatus && p.Status !== filterStatus) return false;
    return true;
  });

  const parkedPayments = allPayments.filter((p) => {
    if (p.PaymentState !== "PARKED") return false;
    if (filterClaimDate && p.ClaimDate !== filterClaimDate) return false;
    if (filterAgencyName && !p.AgencyName.toLowerCase().includes(filterAgencyName.toLowerCase())) return false;
    if (filterStatus && p.Status !== filterStatus) return false;
    return true;
  });

  // Park handlers
  const handleParkSingle = (payment: PaymentRead) => {
    setModal({
      type: "park",
      paymentIds: [payment.Id],
      title: "Park Payment",
      message: "Are you sure you want to park this payment?",
      details: [
        `Agent: ${payment.AgentName} ${payment.AgentSurname}`,
        `Claim Date: ${payment.ClaimDate}`,
        `Amount: ${formatCurrency(payment.CommissionAmount)}`,
      ],
    });
  };

  const handleParkSelected = () => {
    const ids = Array.from(selectedReady);
    const total = readyPayments
      .filter((p) => selectedReady.has(p.Id))
      .reduce((sum, p) => sum + p.CommissionAmount, 0);
    setModal({
      type: "park",
      paymentIds: ids,
      title: "Park Selected Payments",
      message: `Are you sure you want to park ${ids.length} payment(s)?`,
      details: [`Total amount: ${formatCurrency(total)}`],
    });
  };

  // Unpark handlers
  const handleUnparkSingle = (payment: PaymentRead) => {
    setModal({
      type: "unpark",
      paymentIds: [payment.Id],
      title: "Unpark Payment",
      message: "Are you sure you want to unpark this payment?",
      details: [
        `Agent: ${payment.AgentName} ${payment.AgentSurname}`,
        `Claim Date: ${payment.ClaimDate}`,
        `Amount: ${formatCurrency(payment.CommissionAmount)}`,
      ],
    });
  };

  const handleUnparkSelected = () => {
    const ids = Array.from(selectedParked);
    const total = parkedPayments
      .filter((p) => selectedParked.has(p.Id))
      .reduce((sum, p) => sum + p.CommissionAmount, 0);
    setModal({
      type: "unpark",
      paymentIds: ids,
      title: "Unpark Selected Payments",
      message: `Are you sure you want to unpark ${ids.length} payment(s)?`,
      details: [`Total amount: ${formatCurrency(total)}`],
    });
  };

  // Initiate Payment (batch)
  const handleInitiatePayment = () => {
    if (readyPayments.length === 0) return;
    // Group by agency - payments must be for same agency
    const agencies = [...new Set(readyPayments.map((p) => p.AgencyName))];
    if (agencies.length > 1 && !filterAgencyName) {
      setModal({
        type: "success",
        title: "Multiple Agencies",
        message: "Please filter by a single agency before initiating payment.",
      });
      return;
    }
    const total = readyPayments.reduce((sum, p) => sum + p.CommissionAmount, 0);
    setModal({
      type: "batch",
      paymentIds: readyPayments.map((p) => p.Id),
      title: "Initiate Payment",
      message: `Process ${readyPayments.length} payment(s) for ${agencies[0] || "all agencies"}?`,
      details: [
        `Number of payments: ${readyPayments.length}`,
        `Total value: ${formatCurrency(total)}`,
      ],
    });
  };

  const handleConfirm = async () => {
    if (!modal || !modal.paymentIds) return;
    try {
      if (modal.type === "park") {
        await parkPayments(modal.paymentIds);
        setSelectedReady(new Set());
      } else if (modal.type === "unpark") {
        await unparkPayments(modal.paymentIds);
        setSelectedParked(new Set());
      } else if (modal.type === "batch") {
        await createPaymentBatch(modal.paymentIds);
        setModal({
          type: "success",
          title: "Payment Processed",
          message: "Payment batch has been created and invoice generated successfully.",
        });
        await loadPayments();
        return;
      }
      setModal(null);
      await loadPayments();
    } catch {
      setModal({
        type: "success",
        title: "Error",
        message: "An error occurred. Please try again.",
      });
    }
  };

  const toggleReadySelection = (id: number) => {
    setSelectedReady((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleParkedSelection = (id: number) => {
    setSelectedParked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllReady = () => {
    if (selectedReady.size === readyPayments.length) {
      setSelectedReady(new Set());
    } else {
      setSelectedReady(new Set(readyPayments.map((p) => p.Id)));
    }
  };

  const toggleAllParked = () => {
    if (selectedParked.size === parkedPayments.length) {
      setSelectedParked(new Set());
    } else {
      setSelectedParked(new Set(parkedPayments.map((p) => p.Id)));
    }
  };

  if (error) {
    return <div className="text-center py-12"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Claim Date</label>
          <input
            type="date"
            value={filterClaimDate}
            onChange={(e) => setFilterClaimDate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Agency Name</label>
          <input
            type="text"
            value={filterAgencyName}
            onChange={(e) => setFilterAgencyName(e.target.value)}
            placeholder="Filter by agency..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="REG">REG</option>
            <option value="MAN-PAY">MAN-PAY</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setFilterClaimDate(""); setFilterAgencyName(""); setFilterStatus(""); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Main Grid - Ready Payments */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Payments Ready for Payment ({readyPayments.length})
          </h2>
          <div className="flex gap-2">
            {selectedReady.size > 0 && (
              <button
                onClick={handleParkSelected}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600"
              >
                Park Selected ({selectedReady.size})
              </button>
            )}
            <button
              onClick={handleInitiatePayment}
              disabled={readyPayments.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Initiate Payment
            </button>
          </div>
        </div>
        {loading ? (
          <div className="p-6"><div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}</div></div>
        ) : (
          <PaymentTable
            payments={readyPayments}
            selected={selectedReady}
            onToggleSelect={toggleReadySelection}
            onToggleAll={toggleAllReady}
            actionLabel="Park"
            onAction={handleParkSingle}
          />
        )}
      </div>

      {/* Parked Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Parked Payments ({parkedPayments.length})
          </h2>
          {selectedParked.size > 0 && (
            <button
              onClick={handleUnparkSelected}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Unpark Selected ({selectedParked.size})
            </button>
          )}
        </div>
        {loading ? (
          <div className="p-6"><div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}</div></div>
        ) : (
          <PaymentTable
            payments={parkedPayments}
            selected={selectedParked}
            onToggleSelect={toggleParkedSelection}
            onToggleAll={toggleAllParked}
            actionLabel="Unpark"
            onAction={handleUnparkSingle}
          />
        )}
      </div>

      {/* Modals */}
      {modal && modal.type !== "success" && (
        <ConfirmModal
          title={modal.title || "Confirm"}
          message={modal.message || ""}
          details={modal.details}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal && modal.type === "success" && (
        <SuccessModal
          title={modal.title || "Success"}
          message={modal.message || ""}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function PaymentTable({
  payments,
  selected,
  onToggleSelect,
  onToggleAll,
  actionLabel,
  onAction,
}: {
  payments: PaymentRead[];
  selected: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleAll: () => void;
  actionLabel: string;
  onAction: (payment: PaymentRead) => void;
}) {
  if (payments.length === 0) {
    return <div className="p-6 text-center text-gray-500">No payments found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3">
              <input
                type="checkbox"
                checked={selected.size === payments.length && payments.length > 0}
                onChange={onToggleAll}
                aria-label="Select all"
              />
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Claim Date</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bond Amount</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Type</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission %</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grant Date</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg Date</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bank</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Amount</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.map((p) => (
            <tr key={p.Id} className={`hover:bg-gray-50 ${selected.has(p.Id) ? "bg-blue-50" : ""}`}>
              <td className="px-3 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(p.Id)}
                  onChange={() => onToggleSelect(p.Id)}
                  aria-label={`Select payment ${p.Id}`}
                />
              </td>
              <td className="px-3 py-3 whitespace-nowrap">{p.AgencyName}</td>
              <td className="px-3 py-3 whitespace-nowrap">{p.ClaimDate}</td>
              <td className="px-3 py-3 whitespace-nowrap">{p.AgentName} {p.AgentSurname}</td>
              <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(p.BondAmount)}</td>
              <td className="px-3 py-3 whitespace-nowrap">{p.CommissionType}</td>
              <td className="px-3 py-3 whitespace-nowrap">{formatPercentage(p.CommissionPct)}</td>
              <td className="px-3 py-3 whitespace-nowrap">{p.GrantDate}</td>
              <td className="px-3 py-3 whitespace-nowrap">{p.RegistrationDate}</td>
              <td className="px-3 py-3 whitespace-nowrap">{p.Bank}</td>
              <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(p.CommissionAmount)}</td>
              <td className="px-3 py-3 whitespace-nowrap">{formatCurrency(p.VAT)}</td>
              <td className="px-3 py-3 whitespace-nowrap">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  p.Status === "REG" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
                }`}>
                  {p.Status}
                </span>
              </td>
              <td className="px-3 py-3 whitespace-nowrap">
                <button
                  onClick={() => onAction(p)}
                  className={`text-sm font-medium ${
                    actionLabel === "Park"
                      ? "text-amber-600 hover:text-amber-800"
                      : "text-blue-600 hover:text-blue-800"
                  }`}
                >
                  {actionLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PaymentManagementPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>}>
      <PaymentManagementContent />
    </Suspense>
  );
}
