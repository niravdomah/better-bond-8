"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getPaymentBatches, downloadInvoicePdf } from "@/lib/api/endpoints";
import { formatCurrency } from "@/lib/utils/formatting";
import type { PaymentBatchRead } from "@/types/api";

function PaymentsMadeContent() {
  const searchParams = useSearchParams();
  const agencyFilter = searchParams.get("agencyName") || "";

  const [batches, setBatches] = useState<PaymentBatchRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAgency, setFilterAgency] = useState(agencyFilter);
  const [filterReference, setFilterReference] = useState("");

  useEffect(() => {
    async function loadBatches() {
      setLoading(true);
      try {
        const data = await getPaymentBatches();
        setBatches(data.PaymentBatchList);
      } catch {
        setError("Failed to load payment batches.");
      }
      setLoading(false);
    }
    loadBatches();
  }, []);

  const filteredBatches = batches.filter((b) => {
    if (filterAgency && !b.AgencyName.toLowerCase().includes(filterAgency.toLowerCase())) return false;
    if (filterReference && !b.Reference.toLowerCase().includes(filterReference.toLowerCase())) return false;
    return true;
  });

  const handleDownloadInvoice = async (batch: PaymentBatchRead) => {
    try {
      const blob = await downloadInvoicePdf(batch.Id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${batch.Reference}_${batch.AgencyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert("Failed to download invoice.");
    }
  };

  if (error) {
    return <div className="text-center py-12"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payments Made</h1>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Agency Name</label>
          <input
            type="text"
            value={filterAgency}
            onChange={(e) => setFilterAgency(e.target.value)}
            placeholder="Filter by agency..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Batch Reference</label>
          <input
            type="text"
            value={filterReference}
            onChange={(e) => setFilterReference(e.target.value)}
            placeholder="Filter by reference..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => { setFilterAgency(""); setFilterReference(""); }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Batches Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">
            Processed Payment Batches ({filteredBatches.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}
            </div>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No payment batches found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agency Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBatches.map((batch) => (
                  <tr key={batch.Id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{batch.Reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{batch.AgencyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{batch.CreatedDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{batch.PaymentCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(batch.TotalCommissionAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(batch.TotalVat)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        {batch.Status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadInvoice(batch)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Download Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentsMadePage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>}>
      <PaymentsMadeContent />
    </Suspense>
  );
}
