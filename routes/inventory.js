import express from "express";
import { upload } from "../middlewares/upload.js";

import { database } from "../model/database.js";
const router = express.Router({
  mergeParams: true,
});

export default router;
