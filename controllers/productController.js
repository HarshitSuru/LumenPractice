// controllers/productController.js
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { createTransactionAndMaybeAlert } = require("../utils/notifications");

/**
 * addProduct
 */
exports.addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * getProducts
 * supports:
 * - ?search=term  (search in name)
 * - ?category=xyz
 * - ?stockStatus=low|out|ok
 * - pagination: ?page=1&limit=20
 * - sort: ?sortBy=stockLevel:asc or ?sortBy=name:desc
 */
exports.getProducts = async (req, res) => {
  try {
    const { search, category, stockStatus, page = 1, limit = 50, sortBy } = req.query;
    const filter = {};

    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) filter.category = category;

    if (stockStatus === "low") {
      filter.$expr = { $lte: ["$stockLevel", "$reorderPoint"] };
    } else if (stockStatus === "out") {
      filter.stockLevel = { $lte: 0 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    let sort = {};
    if (sortBy) {
      // format: field:order
      const [field, order] = sortBy.split(":");
      sort[field] = order === "desc" ? -1 : 1;
    } else {
      sort = { name: 1 };
    }

    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({ total, page: Number(page), limit: Number(limit), items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * getProductById
 */
exports.getProductById = async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * edit product
 */
exports.updateProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json(p);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * stockIn (increase stock)
 * body: { quantity, performedBy }
 */
exports.stockIn = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: "quantity must be > 0" });

    const productId = req.params.id;
    const { tx, product } = await createTransactionAndMaybeAlert({ productId, type: "IN", quantity });

    res.status(201).json({ transaction: tx, product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * stockOut (decrease stock)
 * body: { quantity, performedBy }
 */
exports.stockOut = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) return res.status(400).json({ error: "quantity must be > 0" });

    const productId = req.params.id;
    const { tx, product } = await createTransactionAndMaybeAlert({ productId, type: "OUT", quantity });

    res.status(201).json({ transaction: tx, product });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * getLowStockProducts (quick endpoint)
 */
exports.getLowStockProducts = async (req, res) => {
  try {
    const low = await Product.find({ $expr: { $lte: ["$stockLevel", "$reorderPoint"] } });
    res.json(low);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
