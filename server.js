import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import user from "./routes/user.js";
import product from "./routes/product.js";
import customer from "./routes/customer.js";
import order from "./routes/order.js";

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = express();
const HOST = "0.0.0.0";

server.set("json spaces", 2);
server.use(express.json());
server.use(cookieParser());
server.use(
  cors({
    origin: [
      "http://localhost:4173",
      "http://192.168.11.108:5173",
      "http://192.168.11.114:5173",
      "http://localhost:5173",
      "http://naoki-thinkpad-t490.local:5173",
      "http://192.168.43.68:5173",
      "http://192.168.1.147:5173",
    ],
    credentials: true,
  }),
);

server.use("/uploads", express.static(path.join(__dirname, "uploads")));
server.use("/", user);

server.use("/product", product);
server.use("/customers", customer);
server.use("/orders", order);
server.listen(process.env.PORT, HOST, () =>
  console.log(
    `api.payment.sarlb13.ma is listening on ${process.env.PORT},in HOST : ${HOST}`,
  ),
);
