import express from "express";
import { upload } from "../middlewares/upload.js";

import { database } from "../model/database.js";
import { addDays, format, startOfWeek } from "date-fns";
import { numberToFrenchWords } from "../libs/utils.js";
const router = express.Router({
  mergeParams: true,
});
/** */
router.post("/", async (req, res) => {
  const {
    orderItems,
    discount,
    paymentMode,
    partiallyPaidIn,
    status,
    type,
    createdBy,
    customerId,
  } = req.body;

  function float_utils(number) {
    return Number(parseFloat(number).toFixed(2));
  }

  async function set_products_stats_by_period(tx, orderItem, key, period) {
    const current = await tx.productStats.findFirst({
      where: { key, productId: orderItem.productId, period },
    });

    const unit = await tx.productUnit.findUnique({
      where: { id: orderItem.productUnitId },
    });

    if (!unit) return;

    const qty = orderItem.quantity / unit.quantityInBase;

    if (current) {
      await tx.productStats.update({
        where: { id: current.id },
        data: {
          soldRevenue: { increment: orderItem.totalAmount },
          soldProfit: { increment: orderItem.totalProfit },
          saleNumber: { increment: 1 },
          soldQuantity: { increment: qty },
        },
      });
    } else {
      await tx.productStats.create({
        data: {
          key,
          productId: orderItem.productId,
          period,
          soldRevenue: orderItem.totalAmount,
          saleNumber: 1,
          soldProfit: orderItem.totalProfit,
          soldQuantity: qty,
        },
      });
    }
  }

  async function set_order_stats_by_period(tx, amount, profit, key, period) {
    const current = await tx.saleStats.findFirst({
      where: { key, period },
    });
    const amount_with_tax = amount * 1.2;
    if (current) {
      await tx.saleStats.update({
        where: { id: current.id },
        data: {
          totalAmount: { increment: amount },
          profit: { increment: profit },
          totalOrders: { increment: 1 },
          totalAmountWithTax: { increment: float_utils(amount_with_tax) },
        },
      });
    } else {
      await tx.saleStats.create({
        data: {
          key,
          period,
          totalAmount: amount,
          profit,
          totalOrders: 1,
          totalAmountWithTax: float_utils(amount_with_tax),
        },
      });
    }
  }

  try {
    const order = await database.$transaction(async (tx) => {
      let total_amount = 0;
      let total_profit = 0;
      let total_amount_with_tax = 0;

      const now = new Date();

      // const tomorrow = addDays(now, 1);
      // for testing purpose to do
      //
      const dailyKey = now.toISOString().split("T")[0];
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-'W'II");
      const monthlyKey = format(now, "MMMM-yyyy");
      const processed = orderItems.map((item) => {
        const amount = float_utils(item.unitPrice * item.quantity);
        const profit = float_utils(item.unitProfit * item.quantity);
        total_amount += amount;
        total_profit += profit;
        return {
          ...item,
          productUnitId: item.productUnit,
          totalAmount: amount,
          totalProfit: profit,
        };
      });

      for (const item of processed) {
        const unit = await tx.productUnit.findUnique({
          where: { id: item.productUnitId },
        });

        if (!unit) return;

        const qty = item.quantity / unit.quantityInBase;

        // process order item in inventory
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            availableQty: {
              decrement: qty,
            },
          },
        });
        await set_products_stats_by_period(tx, item, dailyKey, "DAILY");
        await set_products_stats_by_period(tx, item, weekKey, "WEEKLY");
        await set_products_stats_by_period(tx, item, monthlyKey, "MONTHLY");
      }

      await set_order_stats_by_period(
        tx,
        total_amount,
        total_profit,
        dailyKey,
        "DAILY",
      );
      await set_order_stats_by_period(
        tx,
        total_amount,
        total_profit,
        weekKey,
        "WEEKLY",
      );

      await set_order_stats_by_period(
        tx,
        total_amount,
        total_profit,
        monthlyKey,
        "MONTHLY",
      );
      total_amount_with_tax = float_utils(total_amount * 1.2);
      const totalInWords = numberToFrenchWords(total_amount_with_tax);
      const createdOrder = await tx.order.create({
        data: {
          totalAmountString: totalInWords,
          totalAmount: total_amount,
          totalAmountWithTax: total_amount_with_tax,
          tax: 0.2,
          profit: total_profit,
          type,
          status,
          createdBy,
          customerId,
          discount: discount ? discount : 0,
          paymentMode: paymentMode ? paymentMode : "espèce",
          partiallyPaidIn: partiallyPaidIn ? partiallyPaidIn : 0,
          items: {
            create: processed.map((item) => ({
              name: item.name,
              unitPrice: item.unitPrice,
              productId: item.productId,
              productUnitId: item.productUnitId,
              totalAmount: item.totalAmount,
              totalProfit: item.totalProfit,
              unitProfit: item.unitProfit,
              unit: item.unit,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
              productUnit: true,
            },
          },
        },
      });

      return createdOrder;
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed adding order" });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await database.order.findMany({
      where: {
        archived: false,
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({ orders });
  } catch (error) {
    console.log("Failed to fetch orders ...", error);
    res.status(500).json({ error: "Failed to fetch orders ..." });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const order = await database.order.findUnique({
      where: {
        archived: false,
        id: parseInt(id),
      },

      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
    res.status(200).json({ order });
  } catch (error) {
    console.log("Failed to fetch order ...", error);
    res.status(500).json({ error: "Failed to fetch order ..." });
  }
});

export default router;
