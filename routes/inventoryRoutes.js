const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  createInventory,
  getProductsByInventoryId,
} = require("../controllers/inventoryController");
const router = express.Router();

router.post("/create", requireAuth, createInventory);

router.get("/products/:id", requireAuth, getProductsByInventoryId);

module.exports = router;
