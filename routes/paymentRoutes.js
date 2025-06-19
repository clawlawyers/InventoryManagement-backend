const express = require("express");
const router = express.Router();
const {
  createPayment,
  getPaymentsByOrder,
  getAllPayments,
  getPaymentById,
} = require("../controllers/paymentController");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/razorpayController");
const { requireAuth } = require("../middleware/requireAuth");

// Payment routes
router.post("/test/create", createPayment); // Test route for payment creation
router.post("/create", requireAuth, createPayment); // Create a new payment
router.get("/", requireAuth, getAllPayments); // Get all payments (manager sees all, salesman sees own)
router.get("/order/:orderId", requireAuth, getPaymentsByOrder); // Get payments for a specific order
router.get("/:id", requireAuth, getPaymentById); // Get payment by ID

// Razorpay routes
router.post("/razorpay/create-order", requireAuth, createRazorpayOrder);
router.post("/razorpay/verify-payment", requireAuth, verifyRazorpayPayment);

module.exports = router;
