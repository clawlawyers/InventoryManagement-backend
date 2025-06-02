const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  getProductSalesAnalytics,
  getAllProductsSalesAnalytics,
} = require("../controllers/salesAnalyticsController");

const router = express.Router();

// Get sales analytics for a specific product
router.get("/product", getProductSalesAnalytics);

// Get sales analytics for all products
router.get("/all",  getAllProductsSalesAnalytics);

module.exports = router; 