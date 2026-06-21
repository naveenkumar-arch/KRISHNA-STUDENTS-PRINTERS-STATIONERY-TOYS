-- CreateTable
CREATE TABLE "PaymentSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "razorpayKeyId" TEXT NOT NULL,
    "razorpaySecretEncrypted" TEXT NOT NULL,
    "upiId" TEXT NOT NULL,
    "merchantName" TEXT NOT NULL,
    "paymentMethods" TEXT NOT NULL DEFAULT 'cod,razorpay,upi',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
