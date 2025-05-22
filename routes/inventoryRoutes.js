const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  createInventory,
  getProductByProductId,
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
// router.get("/product/:id", requireAuth, getProductByProductId);

// Inventory Product routes
router.post("/products", requireAuth, createInventoryProduct);
router.get("/:inventoryId/products", requireAuth, getInventoryProducts);
router.get("/product/:productId", requireAuth, getInventoryProductById);
router.put("/product/:productId", requireAuth, updateInventoryProduct);
router.delete(
  "/:inventoryId/products/:productId",
  requireAuth,
  deleteInventoryProduct
);

module.exports = router;
