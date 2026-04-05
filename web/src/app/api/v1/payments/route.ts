import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const claimDate = searchParams.get("ClaimDate");
    const agencyName = searchParams.get("AgencyName");
    const status = searchParams.get("Status");

    const where: Record<string, unknown> = {};
    if (claimDate) where.claimDate = claimDate;
    if (agencyName) where.agencyName = agencyName;
    if (status) where.paymentState = status;

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { claimDate: "desc" },
    });

    return Response.json({
      PaymentList: payments.map((p) => ({
        Id: p.paymentId,
        Reference: p.batchId || "",
        AgencyName: p.agencyName,
        ClaimDate: p.claimDate,
        AgentName: p.agentName,
        AgentSurname: p.agentSurname,
        LastChangedUser: p.lastChangedUser,
        LastChangedDate: p.lastChangedDate || "",
        BondAmount: p.bondAmount,
        CommissionType: p.commissionType,
        CommissionPct: p.commissionPct,
        GrantDate: p.grantDate,
        RegistrationDate: p.regDate,
        Bank: p.bank,
        CommissionAmount: p.commissionAmount,
        VAT: p.vat,
        Status: p.statusCode,
        PaymentState: p.paymentState,
        BatchId: p.batchId,
      })),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to fetch payments"] },
      { status: 500 }
    );
  }
}
