import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { paymentId: parseInt(id) },
    });

    if (!payment) {
      return new Response(null, { status: 404 });
    }

    return Response.json({
      Id: payment.paymentId,
      Reference: payment.batchId || "",
      AgencyName: payment.agencyName,
      ClaimDate: payment.claimDate,
      AgentName: payment.agentName,
      AgentSurname: payment.agentSurname,
      LastChangedUser: payment.lastChangedUser,
      LastChangedDate: payment.lastChangedDate || "",
      BondAmount: payment.bondAmount,
      CommissionType: payment.commissionType,
      CommissionPct: payment.commissionPct,
      GrantDate: payment.grantDate,
      RegistrationDate: payment.regDate,
      Bank: payment.bank,
      CommissionAmount: payment.commissionAmount,
      VAT: payment.vat,
      Status: payment.statusCode,
      PaymentState: payment.paymentState,
      BatchId: payment.batchId,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to fetch payment"] },
      { status: 500 }
    );
  }
}
