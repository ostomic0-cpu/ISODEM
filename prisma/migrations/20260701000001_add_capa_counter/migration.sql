-- CreateTable
CREATE TABLE "CapaCounter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "nextSequence" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CapaCounter_year_key" ON "CapaCounter"("year");

-- AlterTable
ALTER TABLE "CAPA" ADD COLUMN "capaNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CAPA_capaNumber_key" ON "CAPA"("capaNumber");
