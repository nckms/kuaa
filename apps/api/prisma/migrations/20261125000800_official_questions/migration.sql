-- Banco de questões oficiais (ENEM). Só aditivo.
ALTER TABLE "Question" ADD COLUMN "officialRefId" TEXT;
ALTER TABLE "Question" ADD COLUMN "explanationByAi" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "Question_officialRefId_idx" ON "Question"("officialRefId");
CREATE INDEX "Question_source_topicId_idx" ON "Question"("source", "topicId");
