import express from "express";
import { upload } from "../middlewares/upload.js";

import { database } from "../model/database.js";
const router = express.Router({
  mergeParams: true,
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      handle,
      description,
      cost,
      price,
      unit,
      vendorName,
      vendorContact,
      inventoryUnit,
      inventoryQuantity,
      units, // should be JSON string from frontend
    } = req.body;

    let parsedUnits = [];
    if (units) {
      try {
        parsedUnits = JSON.parse(units);
      } catch (err) {
        return res.status(400).json({ error: "Invalid units format" });
      }
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const product = await database.product.create({
      data: {
        name,
        handle,
        description,
        cost: parseFloat(cost),
        price: parseFloat(price),
        unit,
        vendorName,
        vendorContact,
        inventoryUnit,
        inventoryQuantity: parseFloat(inventoryQuantity),
        image,
        units: {
          create: parsedUnits.map((u) => ({
            name: u.name,
            quantityInBase: parseFloat(u.conversion || u.quantityInBase),
            price: parseFloat(u.price),
          })),
        },
      },
      include: { units: true },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const search = req.query.search ? req.query.search.trim() : "";

    const skip = (page - 1) * limit;

    // where clause for search
    const where = search
      ? {
        OR: [
          { name: { contains: search } },
          { handle: { contains: search } },
          { vendorName: { contains: search } },
        ],
      }
      : {};

    // fetch total count for pagination
    const totalCount = await database.product.count({ where });

    // fetch paginated products
    const products = await database.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        units: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      products: products || [],
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      totalCount,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await database.product.findUnique({
      where: { id: Number(id) },
      include: {
        units: true,
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.put("/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  try {
    const {
      name,
      handle,
      description,
      cost,
      price,
      unit,
      vendorName,
      vendorContact,
      inventoryUnit,
      inventoryQuantity,
      units, // should be JSON string from frontend
    } = req.body;

    let parsedUnits = [];
    if (units) {
      try {
        parsedUnits = JSON.parse(units);
      } catch (err) {
        return res.status(400).json({ error: "Invalid units format" });
      }
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // Find the existing product
    const existingProduct = await database.product.findUnique({
      where: { id: Number(id) },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update the product data
    const updatedProduct = await database.product.update({
      where: { id: Number(id) },
      data: {
        name,
        handle,
        description,
        cost: parseFloat(cost),
        price: parseFloat(price),
        unit,
        vendorName,
        vendorContact,
        inventoryUnit,
        inventoryQuantity: parseFloat(inventoryQuantity),
        image: image || existingProduct.image, // Keep the old image if not updated
        units: {
          deleteMany: {}, // First, delete existing units
          create: parsedUnits.map((u) => ({
            name: u.name,
            quantityInBase: parseFloat(u.conversion || u.quantityInBase),
            price: parseFloat(u.price),
          })),
        },
      },
      include: {
        units: true, // Include updated units
      },
    });

    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

router.delete("/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    await database.product.update({
      where: { id: Number(productId) },
      data: {
        archived: true,
      },
    });

    res.status(200).json({ message: "proudct deleted succesfully ..." });
  } catch (error) {
    console.error(`Failed to delete product ... : ${error}`);
    res.status(500).json({ error });
  }
});

export default router;
