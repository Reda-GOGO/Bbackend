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


// Helper to capitalize (optional)
function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper to recursively convert BigInt -> Number
function convertBigInt(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (typeof obj === "object") {
    const res = {};
    for (const key in obj) {
      res[key] = convertBigInt(obj[key]);
    }
    return res;
  }
  return obj;
}

router.get("/", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 300;
    const collection_name = req.query.collection_name
      ? req.query.collection_name.trim()
      : "";
    const collection_handle = req.query.collection_handle
      ? req.query.collection_handle.trim()
      : "";
    const search = req.query.search ? req.query.search.trim() : "";
    const filter_by = req.query.filter_by || "all";
    const skip = (page - 1) * limit;
    const totalItems = await database.product.count();

    // Base filter for raw SQL
    let filterConditions = `WHERE p."name" != ''`;
    if (filter_by === "active") filterConditions += ` AND p."archived" = 0`;
    if (filter_by === "archived") filterConditions += ` AND p."archived" = 1`;
    if (collection_handle) filterConditions += ` AND c.handle = '${collection_handle}'`;

    let products = [];
    let totalCount = 0;

    if (search) {
      const fuzzyPattern = `%${search.split("").join("%")}%`;
      const startsWithPattern = `${search}%`;

      // Raw SQL search
      const rawProducts = await database.$queryRawUnsafe(`
        SELECT p.*, c.handle AS collectionHandle,
          CASE 
            WHEN LOWER(p."name") LIKE LOWER('${startsWithPattern}') THEN 1
            WHEN LOWER(p."name") LIKE LOWER('% ${search}%') THEN 2
            ELSE 3
          END AS relevance
        FROM "Product" p
        LEFT JOIN "Collection" c ON p."collectionId" = c."id"
        ${filterConditions} 
        AND p."name" LIKE '${fuzzyPattern}'
        ORDER BY relevance ASC, p."name" ASC
        LIMIT ${limit} OFFSET ${skip}
      `);

      // Count query
      const countResult = await database.$queryRawUnsafe(`
        SELECT COUNT(*) AS count
        FROM "Product" p
        LEFT JOIN "Collection" c ON p."collectionId" = c."id"
        ${filterConditions} 
        AND p."name" LIKE '${fuzzyPattern}'
      `);

      const rawCount = countResult[0].count;
      totalCount = typeof rawCount === "bigint" ? Number(rawCount) : rawCount || 0;

      // Fetch units and collection data
      const productIds = rawProducts.map((p) => p.id);
      const productsWithUnits = await database.product.findMany({
        where: { id: { in: productIds } },
        include: { units: true, Collection: true },
      });

      // Merge rawProducts with Prisma hydrated units
      products = rawProducts.map((rp) => {
        const fullProduct = productsWithUnits.find((p) => p.id === rp.id) || {};
        return convertBigInt({ ...rp, ...fullProduct });
      });
    } else {
      // Prisma query without search
      const where = { name: { not: "" } };
      if (filter_by === "active") where.archived = false;
      if (filter_by === "archived") where.archived = true;
      if (collection_handle) {
        where.Collection = { is: { handle: collection_handle } };
      }

      totalCount = await database.product.count({ where });
      products = await database.product.findMany({
        where,
        skip,
        take: limit,
        include: { units: true, Collection: true },
        orderBy: { name: "asc" },
      });

      // Convert BigInt
      products = convertBigInt(products);
    }

    return res.status(200).json({
      products,
      totalPages: Math.ceil(totalCount / limit),
      totalProducts: totalCount,
      totalCount,
      currentPage: page,
      totalItems,
    });
  } catch (err) {
    console.error("Search Error:", err);
    next(err);
  }
});


router.get("/empty", async (req, res) => {
  try {
    const products = await database.product.findMany({
      where: {
        name: "",
      },
    });
    if (products) {
      res.status(200).json({ products });
    } else {
      res.status(401).json({ error: "Error fetching empty products" });
    }
  } catch (error) {
    res.status(500).json({ error: `Error server access :  ${error}` });
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
        Collection: true,
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

    // Split incoming units
    const baseUnit = parsedUnits.find((u) => u.isBase);
    const variantUnits = parsedUnits.filter((u) => !u.isBase);

    // Existing variant names in DB
    const existingVariantNames = existingProduct.units
      .filter((u) => !u.isBase)
      .map((u) => u.name);

    // Incoming variant names
    const incomingVariantNames = variantUnits.map((u) => u.name);

    // Variants removed in frontend
    const removedVariantNames = existingVariantNames.filter(
      (name) => !incomingVariantNames.includes(name),
    );
    // Update product
    const updatedProduct = await database.product.update({
      where: { handle },
      data: {
        name,
        description,
        cost: parseFloat(cost),
        price: parseFloat(price),
        unit,
        vendorName,
        vendorContact,
        availableQty: parseFloat(availableQty || "0"),
        image: image || existingProduct.image,

        units: {
          // 1️⃣ delete removed variants only
          deleteMany: {
            name: { in: removedVariantNames },
            isBase: false,
          },

          // 2️⃣ upsert variants (update if exists, create if new)
          upsert: variantUnits.map((u) => ({
            where: {
              productId_name: {
                productId: existingProduct.id,
                name: u.name,
              },
            },
            update: {
              quantityInBase: Number(u.quantityInBase),
              defaultValue: Number(u.defaultValue),
              variantValue: Number(u.variantValue),
              price: Number(u.price),
              cost: Number(u.cost),
            },
            create: {
              name: u.name,
              quantityInBase: Number(u.quantityInBase),
              defaultValue: Number(u.defaultValue),
              variantValue: Number(u.variantValue),
              price: Number(u.price),
              cost: Number(u.cost),
              isBase: false,
            },
          })),

          // 3️⃣ update base unit ONLY (never recreate)
          update: baseUnit
            ? {
              where: {
                productId_name: {
                  productId: existingProduct.id,
                  name: baseUnit.name,
                },
              },
              data: {
                price: Number(baseUnit.price),
                cost: Number(baseUnit.cost),
              },
            }
            : undefined,
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

router.delete("/empty", async (req, res) => {
  try {
    const products = await database.product.deleteMany({
      where: {
        name: "",
      },
    });
    if (products) {
      res.status(200).json({ products });
    } else {
      res.status(401).json({ error: "Error fetching empty products" });
    }
  } catch (error) {
    res.status(500).json({ error: `Error server access :  ${error}` });
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
