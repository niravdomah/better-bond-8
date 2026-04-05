import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get("Reference");
    const agencyName = searchParams.get("AgencyName");

    const where: Record<string, unknown> = {};
    if (reference) where.reference = { contains: reference };
    if (agencyName) where.agencyName = agencyName;

    const batches = await prisma.paymentBatch.findMany({
      where,
      include: { payments: true },
      orderBy: { createdDate: "desc" },
    });

    return Response.json({
      PaymentBatchList: batches.map((b) => ({
        Id: b.id,
        CreatedDate: b.createdDate,
        Status: b.status,
        Reference: b.reference,
        LastChangedUser: b.lastChangedUser,
        AgencyName: b.agencyName,
        PaymentCount: b.payments.length,
        TotalCommissionAmount: b.totalCommissionAmount,
        TotalVat: b.totalVat,
      })),
    });
  } catch (error) {
    console.error("Error fetching payment batches:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to fetch payment batches"] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const lastChangedUser = request.headers.get("LastChangedUser") || "System";
    const body = await request.json();
    const { PaymentIds } = body as { PaymentIds: number[] };

    if (!PaymentIds || PaymentIds.length === 0) {
      return Response.json(
        { MessageType: "Error", Messages: ["PaymentIds is required"] },
        { status: 400 }
      );
    }

    // Get the payments
    const payments = await prisma.payment.findMany({
      where: {
        paymentId: { in: PaymentIds },
        paymentState: "READY",
      },
    });

    if (payments.length === 0) {
      return Response.json(
        { MessageType: "Error", Messages: ["No valid payments found"] },
        { status: 400 }
      );
    }

    // All payments must belong to the same agency
    const agencyNames = [...new Set(payments.map((p) => p.agencyName))];
    if (agencyNames.length > 1) {
      return Response.json(
        { MessageType: "Error", Messages: ["All payments must belong to the same agency"] },
        { status: 400 }
      );
    }

    const agencyName = agencyNames[0];
    const totalCommission = payments.reduce((sum, p) => sum + p.commissionAmount, 0);
    const totalVat = payments.reduce((sum, p) => sum + p.vat, 0);

    // Generate batch reference
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const reference = `BB${yearMonth}-${String(randomNum).padStart(3, "0")}`;

    // Create batch and update payments
    const batch = await prisma.paymentBatch.create({
      data: {
        reference,
        createdDate: now.toISOString().split("T")[0],
        status: "PROCESSED",
        lastChangedUser: lastChangedUser,
        agencyName,
        totalCommissionAmount: totalCommission,
        totalVat: totalVat,
      },
    });

    await prisma.payment.updateMany({
      where: { paymentId: { in: PaymentIds } },
      data: {
        paymentState: "PROCESSED",
        batchId: reference,
        paymentBatchId: batch.id,
        lastChangedUser: lastChangedUser,
        lastChangedDate: now.toISOString().split("T")[0],
        invoiceFile: `invoices/${reference}_${agencyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      },
    });

    return Response.json({
      Id: batch.id,
      MessageType: "Success",
      Messages: [`Payment batch ${reference} created with ${payments.length} payments`],
    });
  } catch (error) {
    console.error("Error creating payment batch:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to create payment batch"] },
      { status: 500 }
    );
  }
}
