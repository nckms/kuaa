-- Plano pago (Kuaa Plus). Migração só aditiva: nenhum dado existente muda.
ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'PLUS';

ALTER TABLE "User" ADD COLUMN "planExpiresAt" TIMESTAMP(3);

-- Registro auditável de cada liberação de plano (pagamento manual ou, depois, webhook).
CREATE TABLE "PlanGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlanGrant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlanGrant_source_reference_key" ON "PlanGrant"("source", "reference");
CREATE INDEX "PlanGrant_userId_createdAt_idx" ON "PlanGrant"("userId", "createdAt");

ALTER TABLE "PlanGrant" ADD CONSTRAINT "PlanGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
