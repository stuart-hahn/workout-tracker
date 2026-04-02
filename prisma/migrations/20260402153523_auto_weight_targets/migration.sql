-- AlterTable
ALTER TABLE "SetLog" ADD COLUMN "targetReps" INTEGER;
ALTER TABLE "SetLog" ADD COLUMN "targetWeight" REAL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutDayId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "movementType" TEXT NOT NULL,
    "notes" TEXT,
    "restSeconds" INTEGER,
    "repRangeMin" INTEGER NOT NULL,
    "repRangeMax" INTEGER NOT NULL,
    "setCount" INTEGER NOT NULL,
    "weightIncrement" REAL,
    "weightRounding" REAL,
    "isBodyweight" BOOLEAN NOT NULL DEFAULT false,
    "assistanceMode" TEXT NOT NULL DEFAULT 'NONE',
    "muscleGroupPrimary" TEXT NOT NULL,
    "muscleGroupsSecondary" TEXT,
    CONSTRAINT "Exercise_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "WorkoutDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Exercise" ("id", "movementType", "muscleGroupPrimary", "muscleGroupsSecondary", "name", "notes", "repRangeMax", "repRangeMin", "restSeconds", "setCount", "workoutDayId") SELECT "id", "movementType", "muscleGroupPrimary", "muscleGroupsSecondary", "name", "notes", "repRangeMax", "repRangeMin", "restSeconds", "setCount", "workoutDayId" FROM "Exercise";
DROP TABLE "Exercise";
ALTER TABLE "new_Exercise" RENAME TO "Exercise";
CREATE INDEX "Exercise_workoutDayId_idx" ON "Exercise"("workoutDayId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'LB',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "passwordHash", "updatedAt") SELECT "createdAt", "email", "id", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
