import express from "express";
import { upload } from "../middlewares/upload.js";

import { database } from "../model/database.js";
import {
  getBestSellingProduct,
  getSellingProducts,
} from "../repositories/productStatsRepository.js";
const router = express.Router({
  mergeParams: true,
});

router.get("/", async (req, res, next) => {
  try {
    // const result = await getBestSellingProduct({
    //   period: "DAILY",
    //   key: "2025-12-05",
    // });
    // res.json({ best_product: result });
    const result = await getSellingProducts({
      period: "DAILY",
    });
    res.json({ result });
  } catch (error) {
    console.log(error);
    next();
  }
});

export default router;
