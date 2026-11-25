-- Responsável do aluno (relatório mensal por e-mail). Só aditivo.
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "confirmTokenHash" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Guardian_userId_key" ON "Guardian"("userId");
CREATE UNIQUE INDEX "Guardian_confirmTokenHash_key" ON "Guardian"("confirmTokenHash");
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
