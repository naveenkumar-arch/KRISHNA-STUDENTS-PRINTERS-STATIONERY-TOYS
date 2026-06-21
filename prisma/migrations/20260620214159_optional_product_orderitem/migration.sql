-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "image", "name", "orderId", "price", "productId", "quantity") SELECT "id", "image", "name", "orderId", "price", "productId", "quantity" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_PaymentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "razorpayKeyId" TEXT NOT NULL,
    "razorpaySecretEncrypted" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "paymentMethods" TEXT NOT NULL DEFAULT 'cod,razorpay',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PaymentSettings" ("createdAt", "id", "merchantName", "paymentMethods", "razorpayKeyId", "razorpaySecretEncrypted", "updatedAt", "upiId") SELECT "createdAt", "id", "merchantName", "paymentMethods", "razorpayKeyId", "razorpaySecretEncrypted", "updatedAt", "upiId" FROM "PaymentSettings";
DROP TABLE "PaymentSettings";
ALTER TABLE "new_PaymentSettings" RENAME TO "PaymentSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
