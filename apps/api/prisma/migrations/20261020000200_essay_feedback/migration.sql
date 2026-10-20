ALTER TABLE "EssayDraft" ADD COLUMN "feedback" JSONB;
ALTER TABLE "EssayDraft" ADD COLUMN "feedbackRequestedAt" TIMESTAMP(3);
ALTER TABLE "EssayDraft" ADD COLUMN "aiConsentAt" TIMESTAMP(3);
