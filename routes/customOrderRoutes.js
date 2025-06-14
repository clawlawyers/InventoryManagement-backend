const express = require("express");
const {
  createCustomOrder,
  getAllCustomOrders,
  generateCustomOrderInvoice,
  createCustomOrderPayment,
  updateCustomOrder,
  deleteCustomOrder,
  updateCustomOrderPayment,
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

// Update a custom order
router.put("/:orderId", updateCustomOrder);

// Delete a custom order
router.delete("/:orderId", deleteCustomOrder);

// Update a payment for a custom order
router.put("/payment/:orderId/:paymentId", updateCustomOrderPayment);

module.exports = router;
