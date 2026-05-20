import express from "express";
import { upload } from "../middlewares/upload.js";
import { database } from "../model/database.js";

const router = express.Router({
  mergeParams: true,
});

// CREATE a collection
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { name, handle, description, products, tags } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    // 1. Parse the stringified array from the frontend
    const parsedProducts = products ? JSON.parse(products) : [];

    const collection = await database.collection.create({
      data: {
        name,
        handle,
        description,
        image: imagePath,
        tags: tags,
        // 2. Connect using the IDs from the parsed array
        products:
          parsedProducts.length > 0
            ? {
              connect: parsedProducts.map((p) => ({
                id: p.id, // Assuming the objects have an 'id' field
              })),
            }
            : undefined,
      },
    });

    res.status(201).json(collection);
  } catch (error) {
    console.error("Backend Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET ALL collections
router.get("/", async (req, res) => {
  try {
    let where = {};
    const search = req.query.search ? req.query.search.trim() : "";
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const filter = req.query.filter_by ? req.query.filter_by.trim() : "all";
    const skip = (page - 1) * limit;
    const totalItems = await database.collection.count();
    if (search) {
      where = {
        name: { contains: search },
      }
    }
    switch (filter) {
      case "all":
        break;
      case "active":
        where.archived = false;
        break;
      case "archived":
        where.archived = true;
        break;
      default:
        break;
    }
    const totalResults = await database.collection.count({ where });
    const collections = await database.collection.findMany({
      where,
      skip,
      take: limit,
      include: { _count: { select: { products: true } } }, // Returns product count
    });
    res.json({
      collections,
      totalPages: Math.ceil(totalResults / limit),
      currentPage: page,
      totalCount: totalResults,
      totalItems,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET SINGLE collection by handle (with its products)
router.get("/:handle", async (req, res) => {
  try {
    const { handle } = req.params;
    const collection = await database.collection.findUnique({
      where: { handle },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            handle: true,
            description: true,
            price: true,
            cost: true,
            unit: true,
            vendorName: true,
            vendorContact: true,
            availableQty: true,
            image: true,
            units: {
              select: {
                name: true,
                quantityInBase: true,
                defaultValue: true,
                variantValue: true,
                price: true,
                cost: true,
                isBase: true,
              },
            },
          },
        }
      },
    });

    if (!collection)
      return res.status(404).json({ message: "Collection not found" });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a collection
router.put("/:handle", upload.single("image"), async (req, res) => {
  try {
    const { handle } = req.params;
    const { name, description, products, archived } = req.body;

    const updateData = {
      name,
      description,
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    } else {
      updateData.image = req.body.image ? req.body.image : null;
    }

    if (products) {
      // "set" replaces existing products with the new list
      updateData.products = {
        set: JSON.parse(products).map((product) => ({
          id: product.id,
        })),
      }

    }
    if (archived) {
      updateData.archived = archived === "true" ? true : false;
    }
    const updated = await database.collection.update({
      where: { handle },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a collection
router.delete("/:handle", async (req, res) => {
  try {
    const { handle } = req.params;
    await database.collection.delete({
      where: { handle },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
