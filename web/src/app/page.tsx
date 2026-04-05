"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDashboard, getPayments } from "@/lib/api/endpoints";
import { formatCurrency } from "@/lib/utils/formatting";
import type {
  PaymentsDashboardRead,
  PaymentRead,
  PaymentStatusReportItem,
  ParkedPaymentsAgingReportItem,
  PaymentsByAgencyReportItem,
} from "@/types/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function MetricCard({
  title,
  value,
  error,
  loading,
}: {
  title: string;
  value: string;
  error?: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6" role="status" aria-label={`Loading ${title}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      {error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  children,
  loading,
}: {
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6" role="status" aria-label={`Loading ${title}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function computeReadyChartData(
  statusReport: PaymentStatusReportItem[],
  agencyFilter?: string
) {
  const filtered = statusReport.filter(
    (item) =>
      item.Status === "READY" &&
      (!agencyFilter || item.AgencyName === agencyFilter)
  );
  const bondComm = filtered
    .filter((item) => item.CommissionType === "Bond Comm")
    .reduce((sum, item) => sum + item.PaymentCount, 0);
  const manualPayments = filtered
    .filter((item) => item.CommissionType === "Manual Payments")
    .reduce((sum, item) => sum + item.PaymentCount, 0);
  return [
    { name: "Bond Comm", count: bondComm },
    { name: "Manual Payments", count: manualPayments },
  ];
}

function computeParkedChartData(
  statusReport: PaymentStatusReportItem[],
  agencyFilter?: string
) {
  const filtered = statusReport.filter(
    (item) =>
      item.Status === "PARKED" &&
      (!agencyFilter || item.AgencyName === agencyFilter)
  );
  const bondComm = filtered
    .filter((item) => item.CommissionType === "Bond Comm")
    .reduce((sum, item) => sum + item.PaymentCount, 0);
  const manualPayments = filtered
    .filter((item) => item.CommissionType === "Manual Payments")
    .reduce((sum, item) => sum + item.PaymentCount, 0);
  return [
    { name: "Bond Comm", count: bondComm },
    { name: "Manual Payments", count: manualPayments },
  ];
}

function computeTotalReadyValue(
  statusReport: PaymentStatusReportItem[],
  agencyFilter?: string
) {
  return statusReport
    .filter(
      (item) =>
        item.Status === "READY" &&
        (!agencyFilter || item.AgencyName === agencyFilter)
    )
    .reduce((sum, item) => sum + item.TotalPaymentAmount, 0);
}

function computeTotalParkedValue(
  statusReport: PaymentStatusReportItem[],
  agencyFilter?: string
) {
  return statusReport
    .filter(
      (item) =>
        item.Status === "PARKED" &&
        (!agencyFilter || item.AgencyName === agencyFilter)
    )
    .reduce((sum, item) => sum + item.TotalPaymentAmount, 0);
}

function computeAgingData(
  agingReport: ParkedPaymentsAgingReportItem[],
  agencyFilter?: string
) {
  const ranges = ["1-3 days", "4-7 days", ">7 days"];
  return ranges.map((range) => ({
    name: range,
    count: agingReport
      .filter(
        (item) =>
          item.Range === range &&
          (!agencyFilter || item.AgencyName === agencyFilter)
      )
      .reduce((sum, item) => sum + item.PaymentCount, 0),
  }));
}

function computePaymentsMadeLast14Days(
  payments: PaymentRead[],
  agencyFilter?: string
) {
  const now = new Date();
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  return payments
    .filter((p) => {
      if (p.PaymentState !== "PROCESSED") return false;
      if (agencyFilter && p.AgencyName !== agencyFilter) return false;
      if (!p.LastChangedDate) return false;
      const changedDate = new Date(p.LastChangedDate);
      return changedDate >= fourteenDaysAgo;
    })
    .reduce((sum, p) => sum + p.CommissionAmount, 0);
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agencyIdParam = searchParams.get("agencyId");

  const [dashboard, setDashboard] = useState<PaymentsDashboardRead | null>(null);
  const [payments, setPayments] = useState<PaymentRead[] | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(agencyIdParam);

  useEffect(() => {
    setSelectedAgency(agencyIdParam);
  }, [agencyIdParam]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const results = await Promise.allSettled([getDashboard(), getPayments()]);

      if (results[0].status === "fulfilled") {
        setDashboard(results[0].value);
      } else {
        setDashboardError("Failed to load dashboard data. Please try again later.");
      }

      if (results[1].status === "fulfilled") {
        setPayments(results[1].value.PaymentList);
      } else {
        setPaymentsError("Failed to load payments data.");
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const handleAgencyClick = useCallback(
    (agencyName: string) => {
      if (selectedAgency === agencyName) {
        setSelectedAgency(null);
        router.push("/", { scroll: false });
      } else {
        setSelectedAgency(agencyName);
        router.push(`/?agencyId=${encodeURIComponent(agencyName)}`, { scroll: false });
      }
    },
    [selectedAgency, router]
  );

  const handleViewAgency = useCallback(
    (agencyName: string) => {
      router.push(`/payments?agencyName=${encodeURIComponent(agencyName)}`);
    },
    [router]
  );

  const readyChartData = useMemo(
    () => dashboard ? computeReadyChartData(dashboard.PaymentStatusReport, selectedAgency || undefined) : [],
    [dashboard, selectedAgency]
  );

  const parkedChartData = useMemo(
    () => dashboard ? computeParkedChartData(dashboard.PaymentStatusReport, selectedAgency || undefined) : [],
    [dashboard, selectedAgency]
  );

  const totalReadyValue = useMemo(
    () => dashboard ? computeTotalReadyValue(dashboard.PaymentStatusReport, selectedAgency || undefined) : 0,
    [dashboard, selectedAgency]
  );

  const totalParkedValue = useMemo(
    () => dashboard ? computeTotalParkedValue(dashboard.PaymentStatusReport, selectedAgency || undefined) : 0,
    [dashboard, selectedAgency]
  );

  const agingData = useMemo(
    () => dashboard ? computeAgingData(dashboard.ParkedPaymentsAgingReport, selectedAgency || undefined) : [],
    [dashboard, selectedAgency]
  );

  const paymentsMade14Days = useMemo(
    () => payments ? computePaymentsMadeLast14Days(payments, selectedAgency || undefined) : 0,
    [payments, selectedAgency]
  );

  const filteredAgencies = useMemo((): PaymentsByAgencyReportItem[] => {
    if (!dashboard) return [];
    return dashboard.PaymentsByAgency;
  }, [dashboard]);

  if (dashboardError && !dashboard) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">{dashboardError}</p>
      </div>
    );
  }

  const isEmpty =
    !loading &&
    dashboard &&
    dashboard.PaymentStatusReport.length === 0 &&
    dashboard.ParkedPaymentsAgingReport.length === 0 &&
    dashboard.PaymentsByAgency.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Payments Ready for Payment" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={readyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Parked Payments" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={parkedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#f59e0b" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Parked Payments Aging Report" loading={loading}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Total Value Ready for Payment" value={formatCurrency(totalReadyValue)} loading={loading} />
        <MetricCard title="Total Value of Parked Payments" value={formatCurrency(totalParkedValue)} loading={loading} />
        <MetricCard title="Payments Made (Last 14 Days)" value={formatCurrency(paymentsMade14Days)} error={paymentsError || undefined} loading={loading} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Agency Summary</h2>
        </div>
        {loading ? (
          <div className="p-6" role="status" aria-label="Loading Agency Summary">
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number of Payments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Commission Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgencies.map((agency) => (
                  <tr
                    key={agency.AgencyName}
                    className={`cursor-pointer hover:bg-blue-50 ${
                      selectedAgency === agency.AgencyName ? "bg-blue-100 ring-2 ring-blue-500" : ""
                    }`}
                    onClick={() => handleAgencyClick(agency.AgencyName)}
                    aria-selected={selectedAgency === agency.AgencyName}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{agency.AgencyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{agency.PaymentCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(agency.TotalCommissionAmount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(agency.Vat)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewAgency(agency.AgencyName);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-lg"></div>}>
      <DashboardContent />
    </Suspense>
  );
}
