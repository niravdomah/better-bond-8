import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await prisma.paymentBatch.findUnique({
      where: { id: parseInt(id) },
      include: { payments: true },
    });

    if (!batch) {
      return new Response(null, { status: 404 });
    }

    return Response.json({
      Id: batch.id,
      CreatedDate: batch.createdDate,
      Status: batch.status,
      Reference: batch.reference,
      LastChangedUser: batch.lastChangedUser,
      AgencyName: batch.agencyName,
      PaymentCount: batch.payments.length,
      TotalCommissionAmount: batch.totalCommissionAmount,
      TotalVat: batch.totalVat,
    });
  } catch (error) {
    console.error("Error fetching payment batch:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to fetch payment batch"] },
      { status: 500 }
    );
  }
}
