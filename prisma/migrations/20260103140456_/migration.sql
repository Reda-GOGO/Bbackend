/*
  Warnings:

  - A unique constraint covering the columns `[productId,name]` on the table `ProductUnit` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProductUnit_productId_name_key" ON "ProductUnit"("productId", "name");
