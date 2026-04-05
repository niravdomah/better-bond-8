import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany();

    // Payment Status Report: group by status + commissionType + agencyName
    const statusReport: Record<
      string,
      { Status: string; PaymentCount: number; TotalPaymentAmount: number; CommissionType: string; AgencyName: string }
    > = {};

    const agingReport: Record<
      string,
      { Range: string; AgencyName: string; PaymentCount: number }
    > = {};

    const agencyReport: Record<
      string,
      { AgencyName: string; PaymentCount: number; TotalCommissionAmount: number; Vat: number }
    > = {};

    const now = new Date();

    // Get all agencies to include zero-payment ones
    const agencies = await prisma.agency.findMany();
    for (const agency of agencies) {
      agencyReport[agency.agencyName] = {
        AgencyName: agency.agencyName,
        PaymentCount: 0,
        TotalCommissionAmount: 0,
        Vat: 0,
      };
    }

    let totalPaymentCountInLast14Days = 0;

    for (const p of payments) {
      // Status report (READY and PARKED)
      if (p.paymentState === "READY" || p.paymentState === "PARKED") {
        const key = `${p.paymentState}-${p.commissionType}-${p.agencyName}`;
        if (!statusReport[key]) {
          statusReport[key] = {
            Status: p.paymentState,
            PaymentCount: 0,
            TotalPaymentAmount: 0,
            CommissionType: p.commissionType,
            AgencyName: p.agencyName,
          };
        }
        statusReport[key].PaymentCount++;
        statusReport[key].TotalPaymentAmount += p.commissionAmount;
      }

      // Aging report for PARKED payments
      if (p.paymentState === "PARKED") {
        const claimDate = new Date(p.claimDate);
        const daysDiff = Math.floor(
          (now.getTime() - claimDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        let range: string;
        if (daysDiff <= 3) range = "1-3 days";
        else if (daysDiff <= 7) range = "4-7 days";
        else range = ">7 days";

        const agingKey = `${range}-${p.agencyName}`;
        if (!agingReport[agingKey]) {
          agingReport[agingKey] = {
            Range: range,
            AgencyName: p.agencyName,
            PaymentCount: 0,
          };
        }
        agingReport[agingKey].PaymentCount++;
      }

      // Agency report (READY payments only - not parked, not processed)
      if (p.paymentState === "READY") {
        if (!agencyReport[p.agencyName]) {
          agencyReport[p.agencyName] = {
            AgencyName: p.agencyName,
            PaymentCount: 0,
            TotalCommissionAmount: 0,
            Vat: 0,
          };
        }
        agencyReport[p.agencyName].PaymentCount++;
        agencyReport[p.agencyName].TotalCommissionAmount += p.commissionAmount;
        agencyReport[p.agencyName].Vat += p.vat;
      }

      // 14-day count for PROCESSED payments
      if (p.paymentState === "PROCESSED" && p.lastChangedDate) {
        const changedDate = new Date(p.lastChangedDate);
        const daysDiff = Math.floor(
          (now.getTime() - changedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 14) {
          totalPaymentCountInLast14Days++;
        }
      }
    }

    return Response.json({
      PaymentStatusReport: Object.values(statusReport),
      ParkedPaymentsAgingReport: Object.values(agingReport),
      TotalPaymentCountInLast14Days: totalPaymentCountInLast14Days,
      PaymentsByAgency: Object.values(agencyReport),
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to fetch dashboard data"] },
      { status: 500 }
    );
  }
}
