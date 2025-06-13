const express = require("express");
const {
  createCustomOrder,
  getAllCustomOrders,
  generateCustomOrderInvoice,
  createCustomOrderPayment,
} = require("../controllers/customOrderController");
const { requireAuth } = require("../middleware/requireAuth"); // Assuming authentication is needed

const router = express.Router();

// Get all custom orders
router.get("/", getAllCustomOrders);

// Create a new custom order
router.post("/", createCustomOrder);

// Generate invoice PDF for a custom order
router.get("/invoice/:orderId", generateCustomOrderInvoice);

// Create a payment for a custom order
router.post("/payment", createCustomOrderPayment);

module.exports = router;
