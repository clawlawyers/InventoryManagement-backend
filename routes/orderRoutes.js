const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getAllOrdersByClientId,
  generateOrderInvoice,
} = require("../controllers/orderController");
const { requireAuth } = require("../middleware/requireAuth");

// Order routes
router.post("/test/create", createOrder); // Test route for single product (legacy)
router.post("/test/create-multiple", createOrder); // Test route for multiple products
router.post("/create", requireAuth, createOrder); // Main route (supports both single and multiple)
router.post("/create-multiple", requireAuth, createOrder); // Explicit multiple products route
router.get("/invoice/:orderId", requireAuth, generateOrderInvoice);
router.get("/:companyId", requireAuth, getAllOrders);
router.get("/:clientId/:companyId", requireAuth, getAllOrdersByClientId);
router.get("/:id", requireAuth, getOrderById);

module.exports = router;
