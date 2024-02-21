-- CreateTable
CREATE TABLE "Login" (
    "hash" TEXT NOT NULL,
    "secureHash" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "success" BOOLEAN NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Login_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "hash" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "txBodyHex" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "TransactionsSessionV2" (
    "hash" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionsSessionV2_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "TransactionV2" (
    "hash" TEXT NOT NULL,
    "txBodyHex" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" TIMESTAMP(3),
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "transactionsSessionHash" TEXT,

    CONSTRAINT "TransactionV2_pkey" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "Login_secureHash_key" ON "Login"("secureHash");

-- AddForeignKey
ALTER TABLE "TransactionV2" ADD CONSTRAINT "TransactionV2_transactionsSessionHash_fkey" FOREIGN KEY ("transactionsSessionHash") REFERENCES "TransactionsSessionV2"("hash") ON DELETE CASCADE ON UPDATE CASCADE;
