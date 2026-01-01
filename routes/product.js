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
      availableQty,
      units,
    } = req.body;

    const parsedUnits = units ? JSON.parse(units) : [];
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    const numericCost = Number(cost);
    const numericPrice = Number(price);

    const safeUnits = parsedUnits.map((u) => {
      const defaultValue = Number(u.defaultValue);
      const variantValue = Number(u.variantValue);

      // 🧠 base unit rule
      const isBase = u.name === unit;

      const quantityInBase = isBase
        ? 1
        : defaultValue > 0 && variantValue > 0
          ? variantValue / defaultValue
          : null;

      if (!Number.isFinite(quantityInBase)) {
        throw new Error(`Invalid quantityInBase for unit "${u.name}"`);
      }

      return {
        name: u.name,
        quantityInBase,
        defaultValue: isBase ? 1 : defaultValue,
        variantValue: isBase ? 1 : variantValue,
        price: Number(u.price),
        cost: numericCost,
        isBase,
      };
    });

    const product = await database.product.create({
      data: {
        name,
        handle,
        description,
        cost: numericCost,
        price: numericPrice,
        unit,
        vendorName,
        vendorContact,
        availableQty: Number(availableQty || 0),
        image,

        units: {
          create: safeUnits,
        },
      },
      include: { units: true },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);
    res
      .status(400)
      .json({ error: error.message || "Failed to create product" });
  }
});

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const search = req.query.search ? req.query.search.trim() : "";
    const sort_by = req.query.sort_by || "name";
    const sort_direction = req.query.sort_direction || "asc";
    const filter_by = req.query.filter_by || "all";
    const skip = (page - 1) * limit;

    // where clause for search
    let where = search
      ? {
        OR: [
          { name: { contains: search } },
          { handle: { contains: search } },
          { vendorName: { contains: search } },
        ],
      }
      : {};
    switch (filter_by) {
      case "active":
        where = { ...where, archived: false };
        break;
      case "archived":
        where = { ...where, archived: true };
        break;
      case "all":
        break;
    }
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
        [sort_by]: sort_direction,
      },
    });

    res.json({
      products: products || [],
      totalPages: Math.ceil(totalCount / limit),
      totalProducts: totalCount,
      currentPage: page,
      totalCount,
    });
  } catch (err) {
    next(err);
    // console.error("Error fetching products:", err);
    // res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/:handle", async (req, res) => {
  const { handle } = req.params;
  try {
    const product = await database.product.findUnique({
      where: { handle: handle },
      include: {
        units: true,
        stats: true,
      },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.put("/:handle", upload.single("image"), async (req, res) => {
  const { handle } = req.params;

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
      availableQty,
      units, // should be JSON string from frontend
    } = req.body;

    // Parse units safely
    let parsedUnits = [];
    if (units) {
      try {
        parsedUnits = JSON.parse(units);
      } catch (err) {
        return res.status(400).json({ error: "Invalid units format" });
      }
    }

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    // Find existing product
    const existingProduct = await database.product.findUnique({
      where: { handle },
      include: { units: true },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update product
    const updatedProduct = await database.product.update({
      where: { handle },
      data: {
        name,
        handle: handle,
        description,
        cost: parseFloat(cost),
        price: parseFloat(price),
        unit,
        vendorName,
        vendorContact,
        availableQty: parseFloat(availableQty || "0"),
        image: image || existingProduct.image,
        // Delete existing units and recreate
        units: {
          deleteMany: {},
          create: parsedUnits.map((u) => ({
            name: u.name,
            quantityInBase: parseFloat(u.quantityInBase || u.conversion || "1"),
            defaultValue: parseFloat(u.defaultValue || "1"),
            variantValue: parseFloat(u.variantValue || "1"),
            price: parseFloat(u.price || "0"),
            cost: parseFloat(u.cost || "0"),
            isBase: u.isBase || false,
          })),
        },
      },
      include: { units: true },
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
