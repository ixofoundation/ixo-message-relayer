-- CreateTable
CREATE TABLE "Login" (
    "hash" TEXT NOT NULL,
    "secureHash" TEXT NOT NULL,
    "data" JSONB NOT NULL,
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
    "validUntil" TIMESTAMP(3) NOT NULL,
    "response" JSONB,
    "timestamp" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("hash")
);

-- CreateIndex
CREATE UNIQUE INDEX "Login_secureHash_key" ON "Login"("secureHash");
