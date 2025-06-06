-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "courseName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PresentInSessions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_PresentInSessions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AbsentInSessions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_AbsentInSessions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PresentInSessions_B_index" ON "_PresentInSessions"("B");

-- CreateIndex
CREATE INDEX "_AbsentInSessions_B_index" ON "_AbsentInSessions"("B");

-- AddForeignKey
ALTER TABLE "_PresentInSessions" ADD CONSTRAINT "_PresentInSessions_A_fkey" FOREIGN KEY ("A") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PresentInSessions" ADD CONSTRAINT "_PresentInSessions_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AbsentInSessions" ADD CONSTRAINT "_AbsentInSessions_A_fkey" FOREIGN KEY ("A") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AbsentInSessions" ADD CONSTRAINT "_AbsentInSessions_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
