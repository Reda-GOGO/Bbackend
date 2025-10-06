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

export default router;
