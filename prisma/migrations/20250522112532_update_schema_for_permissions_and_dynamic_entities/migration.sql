/*
  Warnings:

  - You are about to drop the column `approved` on the `ScheduleEntry` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "DynamicEntity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "entityTypeLabel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "managerId" TEXT,
    CONSTRAINT "DynamicEntity_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduleEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "meetingWith" TEXT,
    "room" TEXT,
    "location" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDynamicEntry" BOOLEAN NOT NULL DEFAULT false,
    "dynamicEntityId" TEXT,
    CONSTRAINT "ScheduleEntry_dynamicEntityId_fkey" FOREIGN KEY ("dynamicEntityId") REFERENCES "DynamicEntity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ScheduleEntry" ("color", "createdAt", "date", "description", "endTime", "id", "location", "meetingWith", "room", "startTime", "status", "title", "type", "updatedAt") SELECT "color", "createdAt", "date", "description", "endTime", "id", "location", "meetingWith", "room", "startTime", "status", "title", "type", "updatedAt" FROM "ScheduleEntry";
DROP TABLE "ScheduleEntry";
ALTER TABLE "new_ScheduleEntry" RENAME TO "ScheduleEntry";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "canManageAuditorium" BOOLEAN NOT NULL DEFAULT false,
    "canManageConferenceHall" BOOLEAN NOT NULL DEFAULT false,
    "canEditPrincipalSchedule" BOOLEAN NOT NULL DEFAULT false,
    "canManageDynamicEntities" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("id", "password", "role", "username") SELECT "id", "password", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
