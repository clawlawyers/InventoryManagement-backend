const express = require("express");
const router = express.Router();
const {
  createWalletTopUpOrder,
  verifyWalletTopUpPayment,
  addCreditToWallet, // Import the new function
  handleRazorpayWebhook, // Import the new webhook handler
} = require("../controllers/walletTopUpController");
const { requireAuth } = require("../middleware/requireAuth");

// Wallet Top-Up routes
router.post("/create-order", requireAuth, createWalletTopUpOrder);
router.post("/verify-payment", requireAuth, verifyWalletTopUpPayment); // This will be called by Razorpay webhook or frontend
router.post("/add-credit", requireAuth, addCreditToWallet); // New route for adding credit

// Webhook route for Razorpay payment updates (no authentication needed for webhooks)
// router.post("/razorpay-webhook", handleRazorpayWebhook); // Commented out for now

module.exports = router;
