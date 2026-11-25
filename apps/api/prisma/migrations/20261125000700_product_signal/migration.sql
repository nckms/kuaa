-- Sinais de produto (cota atingida, interesse no Plus). Só aditivo.
CREATE TABLE "ProductSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "periodKey" TEXT NOT NULL,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductSignal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ProductSignal_userId_kind_periodKey_key" ON "ProductSignal"("userId", "kind", "periodKey");
CREATE INDEX "ProductSignal_kind_createdAt_idx" ON "ProductSignal"("kind", "createdAt");
ALTER TABLE "ProductSignal" ADD CONSTRAINT "ProductSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
