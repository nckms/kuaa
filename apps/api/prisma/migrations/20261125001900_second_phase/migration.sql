-- Questões dissertativas da 2ª fase corrigidas por IA (Kuaa Plus). Só aditivo.
CREATE TABLE "SecondPhaseAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecondPhaseAnswer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SecondPhaseAnswer_userId_questionId_createdAt_idx" ON "SecondPhaseAnswer"("userId", "questionId", "createdAt");
ALTER TABLE "SecondPhaseAnswer" ADD CONSTRAINT "SecondPhaseAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
