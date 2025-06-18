const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  createInventory,
  getProductByProductId,
  downloadInventoryCSV,
  downloadInventoryPDF,
  downloadProductCSV,
  downloadProductPDF,
  deleteInventory,
} = require("../controllers/inventoryController");
const {
  createInventoryProduct,
  getInventoryProducts,
  getInventoryProductById,
  updateInventoryProduct,
  deleteInventoryProduct,
  getInventoryName,
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

router.get("/getInventoryName/:inventoryId", requireAuth, getInventoryName);

// Download routes
router.get("/:id/download/csv", requireAuth, downloadInventoryCSV);
router.get("/:id/download/pdf", requireAuth, downloadInventoryPDF);
router.get("/product/:productId/download/csv", requireAuth, downloadProductCSV);
router.get("/product/:productId/download/pdf", requireAuth, downloadProductPDF);

router.delete("/delete/:id", requireAuth, deleteInventory);

module.exports = router;
