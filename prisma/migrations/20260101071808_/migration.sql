-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "ProductUnit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductUnit" ("archived", "cost", "createdAt", "defaultValue", "id", "isBase", "name", "price", "productId", "quantityInBase", "updatedAt", "variantValue") SELECT "archived", "cost", "createdAt", "defaultValue", "id", "isBase", "name", "price", "productId", "quantityInBase", "updatedAt", "variantValue" FROM "ProductUnit";
DROP TABLE "ProductUnit";
ALTER TABLE "new_ProductUnit" RENAME TO "ProductUnit";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
