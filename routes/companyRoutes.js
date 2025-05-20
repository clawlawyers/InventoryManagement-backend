const express = require("express");
const router = express.Router();
const {
  getInventoriesByCompanyId,
  getCompanyById,
  createCompany,
} = require("../controllers/companyController");
const { requireAuth } = require("../middleware/requireAuth");

// Company routes

router.post("/create", requireAuth, createCompany);
router.get("/:id/inventories", getInventoriesByCompanyId);
router.get("/:id", getCompanyById);

module.exports = router;
