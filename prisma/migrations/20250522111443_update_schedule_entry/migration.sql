/*
  Warnings:

  - Added the required column `room` to the `ScheduleEntry` table without a default value. This is not possible if the table is not empty.

*/
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
    "approved" BOOLEAN DEFAULT true,
    "room" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ScheduleEntry" ("color", "createdAt", "date", "description", "endTime", "id", "location", "meetingWith", "startTime", "status", "title", "type", "updatedAt") SELECT "color", "createdAt", "date", "description", "endTime", "id", "location", "meetingWith", "startTime", "status", "title", "type", "updatedAt" FROM "ScheduleEntry";
DROP TABLE "ScheduleEntry";
ALTER TABLE "new_ScheduleEntry" RENAME TO "ScheduleEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
