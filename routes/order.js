import express from "express";
import { upload } from "../middlewares/upload.js";

import { database } from "../model/database.js";
import { format, startOfWeek } from "date-fns";
const router = express.Router({
  mergeParams: true,
});

router.post("/", async (req, res) => {
  const {
    orderItems,
    status,
    type,
    totalAmount,
    totalAmountString,
    createdBy,
    customerId,
  } = req.body;
  try {
    const order = await database.order.create({
      data: {
        totalAmountString,
        totalAmount,
        type,
        status,
        createdBy,
        customerId,
        items: {
          create: orderItems.map((item) => ({
            name: item.name,
            price: item.price,
            productId: item.productId,
            productUnit: item.productUnit,
            unit: item.unit,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            products: true,
          },
        },
      },
    });

    res.status(201).json({ order });
  } catch (error) {
    console.log("Failed to add order ...", error);
    res.status(500).json({ error: "Failed adding order ..." });
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

router.get("/totalSale", async (req, res) => {
  try {
    const orders = await database.order.findMany({
      where: {
        archived: false,
        status: "partially_paid",
      },
    });
    const total = orders.reduce((sum, o) => {
      return sum + o.totalAmount;
    }, 0);
    res.status(200).json({ total, returnType: typeof total });
  } catch (error) {
    res.status(500).json({
      error: `Failed to fetch total Sales ... : ${error}`,
    });
  }
});

router.get("/daily-stats", async (req, res) => {
  const start = req.params.start | "2025-09-24";
  const end = req.params.end | "2025-10-05";
  try {
    const orders = await database.order.findMany({
      where: {
        archived: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const statsMap = {};
    // function getDays(start, end) {
    //   const days = [];
    //   let current_day_date = new Date(start);
    //   let current_day_string = current_day_date.toISOString().split("T")[0];
    //   while (current_day_string !== end) {
    //     days.push(current_day_string);
    //     current_day_date.setDate(current_day_date.getDate() + 1);
    //     current_day_string = current_day_date.toISOString().split("T")[0];
    //   }
    //   return days;
    // }
    orders.forEach((order) => {
      const t_date = order.createdAt
        .toISOString()
        .split("T")[0]
        .split("-")
        .slice(0, -1); // YYYY-MM-DD
      const date = t_date[0] + "-" + t_date[1];
      if (!statsMap[date]) {
        statsMap[date] = { orderCount: 0, totalIncome: 0, orders: [] };
      }

      statsMap[date].orderCount += 1;
      statsMap[date].totalIncome += order.totalAmount;
      statsMap[date].orders.push(order.id);
    });

    const result = Object.entries(statsMap).map(([day, stats]) => ({
      day,
      orderCount: stats.orderCount,
      totalIncome: parseFloat(stats.totalIncome.toFixed(2)), // Round to 2 decimals
      orders: stats.orders,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: `Failed to fetch order per day record due to : ${error}`,
    });
  }
});

router.get("/weekly-stats", async (req, res) => {
  try {
    const orders = await database.order.findMany({
      where: {
        archived: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const statsMap = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);

      // Get the Monday (startOfWeek) of the week the order falls in
      const weekStart = startOfWeek(orderDate, { weekStartsOn: 1 }); // 1 = Monday
      const weekKey = format(weekStart, "yyyy-MM-dd"); // e.g. 2025-W41

      if (!statsMap[weekKey]) {
        statsMap[weekKey] = { orderCount: 0, totalIncome: 0, orders: [] };
      }

      statsMap[weekKey].orderCount += 1;
      statsMap[weekKey].totalIncome += order.totalAmount;
      statsMap[weekKey].orders.push(order.id);
    });

    const result = Object.entries(statsMap).map(([week, stats]) => ({
      week, // e.g. "2025-W41"
      orderCount: stats.orderCount,
      totalIncome: parseFloat(stats.totalIncome.toFixed(2)),
      orders: stats.orders,
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: `Failed to fetch weekly stats: ${error.message}`,
    });
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
            products: true,
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
