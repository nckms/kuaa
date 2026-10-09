ALTER TABLE "User" ADD COLUMN "preferences" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "activeVestibularId" TEXT;
ALTER TABLE "QuizSession" ADD COLUMN "generationMetadata" JSONB;

CREATE TABLE "UsabilityEvaluation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "answers" JSONB NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "feedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UsabilityEvaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "UsabilityEvaluation_userId_key" ON "UsabilityEvaluation"("userId");

CREATE TABLE "SabiaMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SabiaMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SabiaMessage_userId_createdAt_idx" ON "SabiaMessage"("userId", "createdAt");
