-- RedefineTables: targetReps -> targetRepMin/Max + last-session columns
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SetLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutInstanceId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "targetRepMin" INTEGER,
    "targetRepMax" INTEGER,
    "lastSessionRepMin" INTEGER,
    "lastSessionRepMax" INTEGER,
    "targetWeight" REAL,
    "reps" INTEGER,
    "weight" REAL,
    "rir" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SetLog_workoutInstanceId_fkey" FOREIGN KEY ("workoutInstanceId") REFERENCES "WorkoutInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SetLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SetLog" ("id", "workoutInstanceId", "exerciseId", "setNumber", "targetRepMin", "targetRepMax", "lastSessionRepMin", "lastSessionRepMax", "targetWeight", "reps", "weight", "rir", "completed", "createdAt", "updatedAt")
SELECT "id", "workoutInstanceId", "exerciseId", "setNumber", "targetReps", "targetReps", NULL, NULL, "targetWeight", "reps", "weight", "rir", "completed", "createdAt", "updatedAt" FROM "SetLog";
DROP TABLE "SetLog";
ALTER TABLE "new_SetLog" RENAME TO "SetLog";
CREATE INDEX "SetLog_workoutInstanceId_idx" ON "SetLog"("workoutInstanceId");
CREATE INDEX "SetLog_exerciseId_idx" ON "SetLog"("exerciseId");
CREATE UNIQUE INDEX "SetLog_workoutInstanceId_exerciseId_setNumber_key" ON "SetLog"("workoutInstanceId", "exerciseId", "setNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
