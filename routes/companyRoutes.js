const express = require("express");
const router = express.Router();
const { getInventoriesByCompany } = require("../controllers/companyController");

// Company routes
router.post("/inventories", getInventoriesByCompany);

module.exports = router;
