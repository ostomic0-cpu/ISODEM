-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "scheduleDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "auditorId" TEXT NOT NULL,
    "departmentId" TEXT,
    "checklistData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Audit_auditorId_fkey" FOREIGN KEY ("auditorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Audit" ("auditorId", "checklistData", "createdAt", "id", "scheduleDate", "status", "title", "updatedAt") SELECT "auditorId", "checklistData", "createdAt", "id", "scheduleDate", "status", "title", "updatedAt" FROM "Audit";
DROP TABLE "Audit";
ALTER TABLE "new_Audit" RENAME TO "Audit";
CREATE TABLE "new_AuditFinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'OBS',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuditFinding_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AuditFinding" ("auditId", "createdAt", "description", "id", "status", "type", "updatedAt") SELECT "auditId", "createdAt", "description", "id", "status", "type", "updatedAt" FROM "AuditFinding";
DROP TABLE "AuditFinding";
ALTER TABLE "new_AuditFinding" RENAME TO "AuditFinding";
CREATE TABLE "new_CAPA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "findingId" TEXT NOT NULL,
    "rcaNotes" TEXT NOT NULL,
    "actionPlan" TEXT NOT NULL,
    "verificationNotes" TEXT,
    "status" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "departmentId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "targetDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CAPA_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "AuditFinding" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CAPA_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CAPA_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CAPA" ("actionPlan", "assigneeId", "createdAt", "findingId", "id", "rcaNotes", "status", "targetDate", "updatedAt", "verificationNotes") SELECT "actionPlan", "assigneeId", "createdAt", "findingId", "id", "rcaNotes", "status", "targetDate", "updatedAt", "verificationNotes" FROM "CAPA";
DROP TABLE "CAPA";
ALTER TABLE "new_CAPA" RENAME TO "CAPA";
CREATE UNIQUE INDEX "CAPA_findingId_key" ON "CAPA"("findingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
