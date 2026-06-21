-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StoreSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "upiMobileNumber" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "storeAddress" TEXT NOT NULL,
    "mapEmbedUrl" TEXT NOT NULL,
    "promoPopupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "promoPopupTitle" TEXT NOT NULL,
    "promoPopupText" TEXT NOT NULL,
    "promoPopupImageUrl" TEXT NOT NULL,
    "codEnabled" BOOLEAN NOT NULL DEFAULT true,
    "codMinAmount" REAL NOT NULL DEFAULT 0,
    "codMaxAmount" REAL NOT NULL DEFAULT 5000,
    "codAllowedPincodes" TEXT NOT NULL DEFAULT '',
    "topBannerText" TEXT NOT NULL DEFAULT '✨ Free delivery on stationery items for orders above ₹499! Use code HAPPY15 for 15% OFF! ✨',
    "storeTimings" TEXT NOT NULL DEFAULT 'Daily: 7:30 AM – 11:30 PM',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_StoreSettings" ("adminEmail", "codAllowedPincodes", "codEnabled", "codMaxAmount", "codMinAmount", "id", "mapEmbedUrl", "promoPopupEnabled", "promoPopupImageUrl", "promoPopupText", "promoPopupTitle", "storeAddress", "updatedAt", "upiMobileNumber", "whatsappNumber") SELECT "adminEmail", "codAllowedPincodes", "codEnabled", "codMaxAmount", "codMinAmount", "id", "mapEmbedUrl", "promoPopupEnabled", "promoPopupImageUrl", "promoPopupText", "promoPopupTitle", "storeAddress", "updatedAt", "upiMobileNumber", "whatsappNumber" FROM "StoreSettings";
DROP TABLE "StoreSettings";
ALTER TABLE "new_StoreSettings" RENAME TO "StoreSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
