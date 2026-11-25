-- Provas anteriores completas. Só aditivo.
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exam" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "language" TEXT,
    "questionIds" JSONB NOT NULL,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "flagged" JSONB NOT NULL DEFAULT '[]',
    "durationSeconds" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "correct" INTEGER,
    "wrong" INTEGER,
    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExamAttempt_userId_exam_year_day_idx" ON "ExamAttempt"("userId", "exam", "year", "day");
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
