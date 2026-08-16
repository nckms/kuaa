-- CreateTable
CREATE TABLE "SimuladoAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vestibularId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "flagged" JSONB NOT NULL DEFAULT '[]',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "score" INTEGER,
    "correct" INTEGER,
    "wrong" INTEGER,

    CONSTRAINT "SimuladoAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SimuladoAttempt_userId_vestibularId_weekStart_key" ON "SimuladoAttempt"("userId", "vestibularId", "weekStart");

-- CreateIndex
CREATE INDEX "SimuladoAttempt_userId_vestibularId_idx" ON "SimuladoAttempt"("userId", "vestibularId");

-- AddForeignKey
ALTER TABLE "SimuladoAttempt" ADD CONSTRAINT "SimuladoAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimuladoAttempt" ADD CONSTRAINT "SimuladoAttempt_vestibularId_fkey" FOREIGN KEY ("vestibularId") REFERENCES "Vestibular"("id") ON DELETE CASCADE ON UPDATE CASCADE;
