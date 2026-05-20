/*
  Warnings:

  - You are about to drop the column `soldQuantity` on the `CollectionStats` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "StorageHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "productId" INTEGER,
    CONSTRAINT "StorageHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CollectionStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "saleNumber" REAL NOT NULL,
    "soldRevenue" REAL NOT NULL,
    "soldProfit" REAL NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CollectionStats_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CollectionStats" ("collectionId", "createdAt", "id", "key", "period", "saleNumber", "soldProfit", "soldRevenue") SELECT "collectionId", "createdAt", "id", "key", "period", "saleNumber", "soldProfit", "soldRevenue" FROM "CollectionStats";
DROP TABLE "CollectionStats";
ALTER TABLE "new_CollectionStats" RENAME TO "CollectionStats";
CREATE INDEX "CollectionStats_period_key_createdAt_idx" ON "CollectionStats"("period", "key", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
