-- CreateTable
CREATE TABLE "IndexSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vestibularId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "subjectScores" JSONB NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IndexSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndexSnapshot_userId_vestibularId_capturedAt_idx" ON "IndexSnapshot"("userId", "vestibularId", "capturedAt");

-- AddForeignKey
ALTER TABLE "IndexSnapshot" ADD CONSTRAINT "IndexSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndexSnapshot" ADD CONSTRAINT "IndexSnapshot_vestibularId_fkey" FOREIGN KEY ("vestibularId") REFERENCES "Vestibular"("id") ON DELETE CASCADE ON UPDATE CASCADE;
