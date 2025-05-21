const express = require("express");
const router = express.Router();
const {
  getInventoryByCompanyId,
  getCompanyById,
  createCompany,
} = require("../controllers/companyController");
const { requireAuth } = require("../middleware/requireAuth");

// Company routes

router.post("/create", requireAuth, createCompany);
router.get("/:id/inventory", getInventoryByCompanyId);
router.get("/:id", getCompanyById);

module.exports = router;
