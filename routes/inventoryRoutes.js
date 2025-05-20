const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const { createInventory } = require("../controllers/inventoryController");
const router = express.Router();

router.post("/create", requireAuth, createInventory);

module.exports = router;
