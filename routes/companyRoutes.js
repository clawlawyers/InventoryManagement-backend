const express = require("express");
const router = express.Router();
const {
  getInventoriesByCompanyId,
  getCompanyById,
} = require("../controllers/companyController");

// Company routes
router.get("/:id/inventories", getInventoriesByCompanyId);
router.get("/:id", getCompanyById);

module.exports = router;
