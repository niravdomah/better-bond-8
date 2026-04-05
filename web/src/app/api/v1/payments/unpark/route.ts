import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { PaymentIds } = body as { PaymentIds: number[] };

    if (!PaymentIds || PaymentIds.length === 0) {
      return Response.json(
        { MessageType: "Error", Messages: ["PaymentIds is required"] },
        { status: 400 }
      );
    }

    await prisma.payment.updateMany({
      where: {
        paymentId: { in: PaymentIds },
        paymentState: "PARKED",
      },
      data: {
        paymentState: "READY",
        lastChangedDate: new Date().toISOString().split("T")[0],
      },
    });

    return Response.json({ MessageType: "Success", Messages: ["Payments unparked successfully"] });
  } catch (error) {
    console.error("Error unparking payments:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to unpark payments"] },
      { status: 500 }
    );
  }
}
