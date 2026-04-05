import { prisma } from "@/lib/db";
import type { NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = await prisma.paymentBatch.findUnique({
      where: { id: parseInt(id) },
      include: {
        payments: true,
      },
    });

    if (!batch) {
      return new Response(null, { status: 404 });
    }

    // Get agency details
    const agency = await prisma.agency.findUnique({
      where: { agencyName: batch.agencyName },
    });

    // Generate a simple text-based invoice (PDF generation would require a library)
    const invoiceContent = generateInvoiceText(batch, agency, batch.payments);

    return new Response(invoiceContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${batch.reference}_${batch.agencyName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to generate invoice"] },
      { status: 500 }
    );
  }
}

function generateInvoiceText(
  batch: { reference: string; createdDate: string; agencyName: string; totalCommissionAmount: number; totalVat: number },
  agency: { addressLine1: string; addressLine2: string; addressLine3: string; postalCode: string; vatNumber: string; bankAccountNumber: string; branchName: string; branchCode: string; bankName: string } | null,
  payments: Array<{ paymentId: number; agentName: string; agentSurname: string; commissionType: string; commissionAmount: number; vat: number; commissionPct: number; bondAmount: number }>
) {
  const lines = [
    "COMMISSION PAYMENT INVOICE",
    "=========================",
    "",
    `Invoice Reference: ${batch.reference}`,
    `Date: ${batch.createdDate}`,
    "",
    "AGENCY DETAILS",
    "--------------",
    `Agency: ${batch.agencyName}`,
  ];

  if (agency) {
    lines.push(
      `Address: ${agency.addressLine1}, ${agency.addressLine2}, ${agency.addressLine3}, ${agency.postalCode}`,
      `VAT Number: ${agency.vatNumber}`,
      `Bank: ${agency.bankName}`,
      `Account: ${agency.bankAccountNumber}`,
      `Branch: ${agency.branchName} (${agency.branchCode})`
    );
  }

  lines.push(
    "",
    "PAYMENT DETAILS",
    "---------------",
    "Agent | Commission Type | Bond Amount | Commission % | Commission Amount | VAT",
    "------|----------------|-------------|-------------|-------------------|----"
  );

  for (const p of payments) {
    lines.push(
      `${p.agentName} ${p.agentSurname} | ${p.commissionType} | R ${p.bondAmount.toFixed(2)} | ${p.commissionPct}% | R ${p.commissionAmount.toFixed(2)} | R ${p.vat.toFixed(2)}`
    );
  }

  lines.push(
    "",
    "TOTALS",
    "------",
    `Total Commission: R ${batch.totalCommissionAmount.toFixed(2)}`,
    `Total VAT: R ${batch.totalVat.toFixed(2)}`,
    `Grand Total: R ${(batch.totalCommissionAmount + batch.totalVat).toFixed(2)}`
  );

  return lines.join("\n");
}
