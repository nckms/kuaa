-- Caderno de erros com revisão espaçada. Só aditivo.
ALTER TABLE "QuizSession" ADD COLUMN "isReview" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ReviewItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "sourceQuestionId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "correctStreak" INTEGER NOT NULL DEFAULT 0,
    "timesWrong" INTEGER NOT NULL DEFAULT 1,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "lastWrongAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReviewItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReviewItem_userId_questionKey_key" ON "ReviewItem"("userId", "questionKey");
CREATE INDEX "ReviewItem_userId_resolvedAt_dueAt_idx" ON "ReviewItem"("userId", "resolvedAt", "dueAt");
ALTER TABLE "ReviewItem" ADD CONSTRAINT "ReviewItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
