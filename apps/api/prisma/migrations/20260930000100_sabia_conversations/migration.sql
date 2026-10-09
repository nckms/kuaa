CREATE TABLE "SabiaConversation" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SabiaConversation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SabiaConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
ALTER TABLE "SabiaMessage" ADD COLUMN "conversationId" TEXT;
INSERT INTO "SabiaConversation" ("id", "userId", "title", "createdAt", "updatedAt")
SELECT 'legacy_' || "userId", "userId", 'Conversa anterior', MIN("createdAt"), MAX("createdAt")
FROM "SabiaMessage" GROUP BY "userId";
UPDATE "SabiaMessage" SET "conversationId" = 'legacy_' || "userId";
ALTER TABLE "SabiaMessage" ADD CONSTRAINT "SabiaMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "SabiaConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "SabiaConversation_userId_updatedAt_idx" ON "SabiaConversation"("userId", "updatedAt");
CREATE INDEX "SabiaMessage_conversationId_createdAt_idx" ON "SabiaMessage"("conversationId", "createdAt");
