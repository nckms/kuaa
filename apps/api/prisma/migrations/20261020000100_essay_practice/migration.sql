CREATE TYPE "EssayStatus" AS ENUM ('DRAFT', 'SUBMITTED');

CREATE TABLE "EssayDraft" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vestibularId" TEXT NOT NULL,
  "themeId" TEXT NOT NULL,
  "themeTitle" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "textType" TEXT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "selfReview" JSONB NOT NULL DEFAULT '{}',
  "status" "EssayStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EssayDraft_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EssayDraft_userId_createdAt_idx" ON "EssayDraft"("userId", "createdAt");
ALTER TABLE "EssayDraft" ADD CONSTRAINT "EssayDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EssayDraft" ADD CONSTRAINT "EssayDraft_vestibularId_fkey" FOREIGN KEY ("vestibularId") REFERENCES "Vestibular"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
