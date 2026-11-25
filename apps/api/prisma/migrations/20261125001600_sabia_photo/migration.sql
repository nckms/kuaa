-- Pergunta ao Sabiá por foto (Kuaa Plus). Só aditivo.
ALTER TABLE "SabiaMessage" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'text';
