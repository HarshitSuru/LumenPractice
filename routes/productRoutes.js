// routes/productRoutes.js
const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authenticate } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

// Public read endpoints (optionally require auth depending on policy):
router.get("/", authenticate, productController.getProducts);
router.get("/low", authenticate, authorize("Admin","Manager"), productController.getLowStockProducts);
router.get("/:id", authenticate, productController.getProductById);

// Admin/Manager operations:
router.post("/", authenticate, authorize("Admin","Manager"), productController.addProduct);
router.put("/:id", authenticate, authorize("Admin","Manager"), productController.updateProduct);
router.delete("/:id", authenticate, authorize("Admin"), productController.deleteProduct);

// Stock operations (Manager/Staff allowed to perform stock in/out as per policy):
router.post("/:id/stock-in", authenticate, authorize("Admin","Manager","Staff"), productController.stockIn);
router.post("/:id/stock-out", authenticate, authorize("Admin","Manager","Staff"), productController.stockOut);

module.exports = router;
