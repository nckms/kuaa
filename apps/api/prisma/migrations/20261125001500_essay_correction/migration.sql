-- Correção completa de redação por competência (Kuaa Plus). Só aditivo.
CREATE TABLE "EssayCorrection" (
    "id" TEXT NOT NULL,
    "essayId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total" INTEGER,
    "result" JSONB,
    "rewrites" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EssayCorrection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EssayCorrection_essayId_key" ON "EssayCorrection"("essayId");
CREATE INDEX "EssayCorrection_userId_createdAt_idx" ON "EssayCorrection"("userId", "createdAt");
ALTER TABLE "EssayCorrection" ADD CONSTRAINT "EssayCorrection_essayId_fkey" FOREIGN KEY ("essayId") REFERENCES "EssayDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EssayCorrection" ADD CONSTRAINT "EssayCorrection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
