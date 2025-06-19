const express = require("express");
const router = express.Router();
const {
  createWalletTopUpOrder,
  verifyWalletTopUpPayment,
} = require("../controllers/walletTopUpController");
const { requireAuth } = require("../middleware/requireAuth");

// Wallet Top-Up routes
router.post("/create-order", requireAuth, createWalletTopUpOrder);
router.post("/verify-payment", requireAuth, verifyWalletTopUpPayment); // This will be called by Razorpay webhook or frontend

module.exports = router;
