import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import user from "./routes/user.js";
import product from "./routes/product.js";
import customer from "./routes/customer.js";
import order from "./routes/order.js";
import productStats from "./routes/productStats.js";

import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = express();
const HOST = "0.0.0.0";

server.set("json spaces", 2);
server.use(express.json());
server.use(cookieParser());
server.use(morgan("dev"));
server.use(
  cors({
    origin: [
      "http://localhost:4173",
      "http://192.168.0.71:5173",
      "http://192.168.11.108:5173",
      "http://192.168.11.114:5173",
      "http://192.168.11.117:5173",
      "http://192.168.11.127:5173",
      "http://192.168.11.109:5173",
      "http://192.168.11.247:5173",
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
server.use("/productStats", productStats);

server.post("/pdf", async (req, res) => {
  const { id, theme = "dark" } = req.body;
  const url = `http://localhost:5173/pdf/${id}`;

  try {
    const browser = await puppeteer.launch({
      headless: false, // Use true for server; set false for debugging
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set viewport for desktop layout
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 0 });

    // Go to the page first
    await page.goto(url, { waitUntil: "networkidle0" });

    // Apply dark/light mode manually for Tailwind
    await page.evaluate((theme) => {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.style.backgroundColor = "#111"; // optional for background
      } else {
        document.documentElement.classList.remove("dark");
        document.body.style.backgroundColor = "#fff";
      }
    }, theme);

    // Emulate media features for components that rely on prefers-color-scheme
    await page.emulateMediaFeatures([
      {
        name: "prefers-color-scheme",
        value: theme === "dark" ? "dark" : "light",
      },
    ]);

    // Wait a little for Tailwind classes to apply
    const delay = (ms) => new Promise((res) => setTimeout(res, ms));
    await delay(500);

    // Wait for the component to load
    await page.waitForSelector(".print-root");

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      // margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=product-${id}.pdf`,
    });
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation failed");
  }
});

server.listen(process.env.PORT, HOST, () =>
  console.log(
    `api.payment.sarlb13.ma is listening on ${process.env.PORT},in HOST : ${HOST}`,
  ),
);
