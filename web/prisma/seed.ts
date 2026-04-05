import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL || "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

interface ParsedPayment {
  paymentId: number;
  agencyName: string;
  batchId: string | null;
  claimDate: string;
  agentName: string;
  agentSurname: string;
  commissionType: string;
  bondAmount: number;
  commissionPct: number;
  grantDate: string;
  regDate: string;
  bank: string;
  commissionAmount: number;
  vat: number;
  statusCode: string;
  paymentState: string;
  invoiceFile: string | null;
}

function parseDataset(): { agencies: Array<Record<string, string>>; payments: ParsedPayment[] } {
  const datasetPath = path.resolve(__dirname, "../../documentation/dataset.md");
  const content = fs.readFileSync(datasetPath, "utf-8");
  const lines = content.split("\n");

  const agencies: Array<Record<string, string>> = [];
  const payments: ParsedPayment[] = [];

  let section = "";

  for (const line of lines) {
    if (line.startsWith("## 1. Agencies")) { section = "agencies"; continue; }
    if (line.startsWith("## 2. Agents")) { section = "agents"; continue; }
    if (line.startsWith("## 3. Payments")) { section = "payments"; continue; }
    if (line.startsWith("## 4. Invoices")) { section = "invoices"; continue; }

    if (!line.startsWith("|") || line.startsWith("| ---") || line.startsWith("| Agency") || line.startsWith("| Payment")) continue;

    // Split by | but keep empty cells - trim leading/trailing empty from split
    const rawCells = line.split("|").map(c => c.trim());
    // Remove first and last empty strings from split (before first | and after last |)
    const cells = rawCells.slice(1, rawCells.length - 1);

    if (section === "agencies" && cells.length >= 10 && !cells[0].startsWith("---")) {
      agencies.push({
        agencyName: cells[0],
        addressLine1: cells[1],
        addressLine2: cells[2],
        addressLine3: cells[3],
        postalCode: cells[4],
        bankAccountNumber: cells[5],
        branchName: cells[6],
        branchCode: cells[7],
        bankName: cells[8],
        vatNumber: cells[9],
      });
    }

    if (section === "payments" && cells.length >= 14 && !cells[0].startsWith("---")) {
      const paymentId = parseInt(cells[0]);
      if (isNaN(paymentId)) continue;

      const agencyName = cells[1];
      const batchId = cells[2].trim() || null;
      const claimDate = cells[3];
      const agentFullName = cells[4];
      const commissionType = cells[5];

      // Parse bond amount: "R 1 240 396.01" -> 1240396.01
      const bondAmountStr = cells[6].replace(/R/g, "").replace(/\s/g, "").trim();
      const bondAmount = parseFloat(bondAmountStr);

      // Parse commission %: "0.803%" -> 0.803
      const commissionPct = parseFloat(cells[7].replace("%", ""));

      const grantDate = cells[8];
      const regDate = cells[9];
      const bank = cells[10];
      const commissionAmount = parseFloat(cells[11]);
      const vat = parseFloat(cells[12]);
      const statusCode = cells[13];
      const paymentState = cells[14];
      const invoiceFile = cells.length > 15 && cells[15].trim() ? cells[15].trim() : null;

      // Split agent name
      const nameParts = agentFullName.split(" ");
      const agentName = nameParts[0];
      const agentSurname = nameParts.slice(1).join(" ");

      payments.push({
        paymentId,
        agencyName,
        batchId,
        claimDate,
        agentName,
        agentSurname,
        commissionType,
        bondAmount,
        commissionPct,
        grantDate,
        regDate,
        bank,
        commissionAmount,
        vat,
        statusCode,
        paymentState,
        invoiceFile,
      });
    }
  }

  return { agencies, payments };
}

async function main() {
  console.log("Parsing dataset...");
  const { agencies, payments } = parseDataset();
  console.log(`Found ${agencies.length} agencies and ${payments.length} payments`);

  console.log("Clearing existing data...");
  await prisma.payment.deleteMany();
  await prisma.paymentBatch.deleteMany();
  await prisma.agency.deleteMany();

  console.log("Creating agencies...");
  for (const agency of agencies) {
    await prisma.agency.create({ data: agency });
  }

  // Create payment batches for PROCESSED payments
  console.log("Creating payment batches...");
  const batchMap = new Map<string, { agencyName: string; payments: ParsedPayment[] }>();
  for (const p of payments) {
    if (p.paymentState === "PROCESSED" && p.batchId) {
      if (!batchMap.has(p.batchId)) {
        batchMap.set(p.batchId, { agencyName: p.agencyName, payments: [] });
      }
      batchMap.get(p.batchId)!.payments.push(p);
    }
  }

  const batchIdMap = new Map<string, number>(); // batchId -> DB id
  for (const [reference, batch] of batchMap) {
    const totalCommission = batch.payments.reduce((sum, p) => sum + p.commissionAmount, 0);
    const totalVat = batch.payments.reduce((sum, p) => sum + p.vat, 0);
    const createdDate = batch.payments[0].claimDate;

    const created = await prisma.paymentBatch.create({
      data: {
        reference,
        createdDate,
        status: "PROCESSED",
        lastChangedUser: "System",
        agencyName: batch.agencyName,
        totalCommissionAmount: totalCommission,
        totalVat: totalVat,
      },
    });
    batchIdMap.set(reference, created.id);
  }
  console.log(`Created ${batchMap.size} payment batches`);

  // Create payments
  console.log("Creating payments...");
  for (const p of payments) {
    await prisma.payment.create({
      data: {
        paymentId: p.paymentId,
        agencyName: p.agencyName,
        batchId: p.batchId,
        claimDate: p.claimDate,
        agentName: p.agentName,
        agentSurname: p.agentSurname,
        commissionType: p.commissionType,
        bondAmount: p.bondAmount,
        commissionPct: p.commissionPct,
        grantDate: p.grantDate,
        regDate: p.regDate,
        bank: p.bank,
        commissionAmount: p.commissionAmount,
        vat: p.vat,
        statusCode: p.statusCode,
        paymentState: p.paymentState,
        invoiceFile: p.invoiceFile,
        lastChangedUser: "System",
        lastChangedDate: p.paymentState === "PROCESSED" ? p.claimDate : null,
        paymentBatchId: p.batchId ? batchIdMap.get(p.batchId) || null : null,
      },
    });
  }
  console.log(`Created ${payments.length} payments`);

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
