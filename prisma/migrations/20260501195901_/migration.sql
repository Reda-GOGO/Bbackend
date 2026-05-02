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
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("archived", "createdAt", "deleted", "id", "name", "orderId", "productId", "productUnitId", "quantity", "totalAmount", "totalProfit", "unit", "unitPrice", "unitProfit", "updatedAt") SELECT "archived", "createdAt", "deleted", "id", "name", "orderId", "productId", "productUnitId", "quantity", "totalAmount", "totalProfit", "unit", "unitPrice", "unitProfit", "updatedAt" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
