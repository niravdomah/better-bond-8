import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Delete all payments, batches, then recreate from seed
    await prisma.payment.deleteMany();
    await prisma.paymentBatch.deleteMany();

    // Re-seed is done by calling prisma db seed externally
    // For the demo, we just clear the data and let the user re-seed
    return Response.json({
      MessageType: "Success",
      Messages: ["Demo data has been reset. Run 'npx prisma db seed' to re-populate."],
    });
  } catch (error) {
    console.error("Error resetting demo:", error);
    return Response.json(
      { MessageType: "Error", Messages: ["Failed to reset demo data"] },
      { status: 500 }
    );
  }
}
