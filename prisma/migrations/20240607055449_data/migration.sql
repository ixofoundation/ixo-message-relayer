-- CreateTable
CREATE TABLE "Data" (
    "hash" TEXT NOT NULL,
    "secureHash" TEXT,
    "data" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "response" JSONB,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Data_pkey" PRIMARY KEY ("hash")
);
