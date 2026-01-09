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
    const collections = await database.collection.findMany({
      include: { _count: { select: { products: true } } }, // Returns product count
    });
    res.json({ collections });
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
      include: { products: true },
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
    const { name, description, productIds } = req.body;

    const updateData = {
      name,
      description,
    };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    if (productIds) {
      // "set" replaces existing products with the new list
      updateData.products = {
        set: JSON.parse(productIds).map((id) => ({ id: parseInt(id) })),
      };
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
