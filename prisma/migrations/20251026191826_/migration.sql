-- DropIndex
DROP INDEX "ProductStats_period_key_idx";

-- DropIndex
DROP INDEX "SaleStats_period_key_idx";

-- CreateIndex
CREATE INDEX "ProductStats_period_key_createdAt_idx" ON "ProductStats"("period", "key", "createdAt");

-- CreateIndex
CREATE INDEX "SaleStats_period_key_createdAt_idx" ON "SaleStats"("period", "key", "createdAt");
