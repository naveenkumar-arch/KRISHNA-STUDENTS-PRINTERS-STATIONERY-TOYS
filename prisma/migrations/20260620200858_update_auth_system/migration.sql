-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "lastResetRequest" DATETIME,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" DATETIME,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "mobileNumber" TEXT,
    "dob" TEXT,
    "gender" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "totpSecret" TEXT,
    "totpVerified" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("avatarUrl", "bio", "createdAt", "dob", "email", "emailVerified", "gender", "id", "image", "isActive", "isSuspended", "lastResetRequest", "lockUntil", "loginAttempts", "mobileNumber", "name", "password", "resetToken", "resetTokenExpiry", "role", "totpSecret", "totpVerified", "updatedAt") SELECT "avatarUrl", "bio", "createdAt", "dob", "email", "emailVerified", "gender", "id", "image", "isActive", "isSuspended", "lastResetRequest", "lockUntil", "loginAttempts", "mobileNumber", "name", "password", "resetToken", "resetTokenExpiry", "role", "totpSecret", "totpVerified", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
