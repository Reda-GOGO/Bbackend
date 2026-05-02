-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "totalAmount" REAL NOT NULL,
    "unitProfit" REAL NOT NULL,
    "totalProfit" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "productUnitId" INTEGER,
    "productId" INTEGER NOT NULL,
    "orderId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME,
    CONSTRAINT "OrderItem_productUnitId_fkey" FOREIGN KEY ("productUnitId") REFERENCES "ProductUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("archived", "createdAt", "deleted", "id", "name", "orderId", "productId", "productUnitId", "quantity", "totalAmount", "totalProfit", "unit", "unitPrice", "unitProfit", "updatedAt") SELECT "archived", "createdAt", "deleted", "id", "name", "orderId", "productId", "productUnitId", "quantity", "totalAmount", "totalProfit", "unit", "unitPrice", "unitProfit", "updatedAt" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_ProductStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "soldQuantity" REAL NOT NULL,
    "saleNumber" REAL NOT NULL,
    "soldRevenue" REAL NOT NULL,
    "soldProfit" REAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductStats_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductStats" ("createdAt", "id", "key", "period", "productId", "saleNumber", "soldProfit", "soldQuantity", "soldRevenue") SELECT "createdAt", "id", "key", "period", "productId", "saleNumber", "soldProfit", "soldQuantity", "soldRevenue" FROM "ProductStats";
DROP TABLE "ProductStats";
ALTER TABLE "new_ProductStats" RENAME TO "ProductStats";
CREATE INDEX "ProductStats_period_key_createdAt_idx" ON "ProductStats"("period", "key", "createdAt");
CREATE TABLE "new_ProductUnit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantityInBase" REAL NOT NULL,
    "isBase" BOOLEAN NOT NULL,
    "defaultValue" REAL NOT NULL,
    "variantValue" REAL NOT NULL,
    "price" REAL NOT NULL,
    "cost" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ProductUnit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductUnit" ("archived", "cost", "createdAt", "defaultValue", "id", "isBase", "name", "price", "productId", "quantityInBase", "updatedAt", "variantValue") SELECT "archived", "cost", "createdAt", "defaultValue", "id", "isBase", "name", "price", "productId", "quantityInBase", "updatedAt", "variantValue" FROM "ProductUnit";
DROP TABLE "ProductUnit";
ALTER TABLE "new_ProductUnit" RENAME TO "ProductUnit";
CREATE UNIQUE INDEX "ProductUnit_productId_name_key" ON "ProductUnit"("productId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
