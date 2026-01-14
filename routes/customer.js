import express from "express";
import { upload } from "../middlewares/upload.js";

import { database } from "../model/database.js";
const router = express.Router({
  mergeParams: true,
});

router.get("/", async (req, res) => {
  try {
    const customers = await database.customer.findMany({
      where: {
        archived: {
          not: true,
        },
      },
    });

    if (!customers) {
      return res.status(404).json({ error: "Customers not found ..." });
    }

    res.status(200).json({ customers });
  } catch (error) {
    console.error("error fetching customer ...", error);
    res.status(500).json({ error: "Failed to reach Customers ..." });
  }
});

router.post("/", async (req, res) => {
  const { name, ice, phone, address, email } = req.body;
  try {
    const customer = await database.customer.create({
      data: {
        name,
        ice,
        phone,
        address,
        email,
      },
    });
    res.status(201).json({ customer });
  } catch (error) {
    console.error("error adding customer ...", error);
    res.status(500).json({ error: "Failed to add customer" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, ice, phone, address, email } = req.body;

  try {
    const isCustomerExist = await database.customer.findFirst({
      where: {
        id,
      },
    });
    if (isCustomerExist) {
      await database.customer.update({
        where: {
          id,
        },
        data: {
          name,
          ice,
          email,
          address,
          phone,
        },
      });
    } else {
      res.status(401).json({ error: "customer not found ..." });
    }
  } catch (error) {
    res.status(500).json({ error: "Error updating & loading customer ..." });
  }
});

router.delete("/:id", async (req, res) => {
  const customerId = Number(req.params.id);
  if (isNaN(customerId)) {
    return res
      .status(401)
      .json({ error: "Error reading customer , id not in correct format " });
  }
  try {
    const customer = await database.customer.update({
      where: {
        id: customerId,
      },
      data: {
        archived: true,
      },
    });
    if (customer) {
      res.status(200).json({ customer });
    } else {
      res
        .status(401)
        .json({ error: "Error fetching & deleting customer record" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error deleting customer records ..." });
  }
});

export default router;
