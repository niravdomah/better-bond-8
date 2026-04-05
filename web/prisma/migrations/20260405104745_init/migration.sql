-- CreateTable
CREATE TABLE "Agency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "agencyName" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT NOT NULL,
    "addressLine3" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "branchCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "paymentId" INTEGER NOT NULL,
    "agencyName" TEXT NOT NULL,
    "batchId" TEXT,
    "claimDate" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "agentSurname" TEXT NOT NULL,
    "commissionType" TEXT NOT NULL,
    "bondAmount" REAL NOT NULL,
    "commissionPct" REAL NOT NULL,
    "grantDate" TEXT NOT NULL,
    "regDate" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "commissionAmount" REAL NOT NULL,
    "vat" REAL NOT NULL,
    "statusCode" TEXT NOT NULL,
    "paymentState" TEXT NOT NULL,
    "invoiceFile" TEXT,
    "lastChangedUser" TEXT NOT NULL DEFAULT 'System',
    "lastChangedDate" TEXT,
    "paymentBatchId" INTEGER,
    CONSTRAINT "Payment_agencyName_fkey" FOREIGN KEY ("agencyName") REFERENCES "Agency" ("agencyName") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_paymentBatchId_fkey" FOREIGN KEY ("paymentBatchId") REFERENCES "PaymentBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentBatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "createdDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastChangedUser" TEXT NOT NULL,
    "agencyName" TEXT NOT NULL,
    "totalCommissionAmount" REAL NOT NULL,
    "totalVat" REAL NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_agencyName_key" ON "Agency"("agencyName");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentId_key" ON "Payment"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentBatch_reference_key" ON "PaymentBatch"("reference");
