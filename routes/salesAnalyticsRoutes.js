const express = require("express");
const { requireAuth } = require("../middleware/requireAuth");
const {
  getProductSalesAnalytics,
  getAllProductsSalesAnalytics,
  getOrderPaymentStats,
  getCumulativeStockStats,
  getProductWiseStockStats,
  getDesignWiseStockStats
} = require("../controllers/salesAnalyticsController");

const router = express.Router();

// Get sales analytics for a specific product
router.get("/product", requireAuth, getProductSalesAnalytics);

// Get sales analytics for all products
router.get("/all", requireAuth, getAllProductsSalesAnalytics);

// Get order payment statistics
router.get("/payments", requireAuth, getOrderPaymentStats);

// Get cumulative stock statistics
router.get("/stock", requireAuth, getCumulativeStockStats);

// Get product-wise stock statistics
router.get("/stock/products", getProductWiseStockStats);

// Get design-wise stock statistics
router.get("/stock/designs", getDesignWiseStockStats);

module.exports = router; 