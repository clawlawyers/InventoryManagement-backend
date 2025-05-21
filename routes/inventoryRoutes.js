const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  createInventory,
  getProductsByInventoryId,
} = require("../controllers/inventoryController");
const {
  createInventoryProduct,
  getInventoryProducts,
  getInventoryProductById,
  updateInventoryProduct,
  deleteInventoryProduct,
} = require("../controllers/inventoryProductController");
const router = express.Router();

router.post("/create", requireAuth, createInventory);
router.get("/products/:id", requireAuth, getProductsByInventoryId);

// Inventory Product routes
router.post("/products", requireAuth, createInventoryProduct);
router.get("/:inventoryId/products", requireAuth, getInventoryProducts);
router.get("/products/:productId", requireAuth, getInventoryProductById);
router.put("/products/:productId", requireAuth, updateInventoryProduct);
router.delete(
  "/:inventoryId/products/:productId",
  requireAuth,
  deleteInventoryProduct
);

module.exports = router;
