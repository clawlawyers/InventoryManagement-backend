const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  getProductSalesAnalytics,
  getAllProductsSalesAnalytics,
  getOrderPaymentStats
} = require("../controllers/salesAnalyticsController");

const router = express.Router();

// Get sales analytics for a specific product
router.get("/product",  getProductSalesAnalytics);

// Get sales analytics for all products
router.get("/all",  getAllProductsSalesAnalytics);

// Get order payment statistics
router.get("/payments",  getOrderPaymentStats);

module.exports = router; 