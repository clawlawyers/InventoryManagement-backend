const express = require("express");
const router = express.Router();
const { sendPaymentWhatsApp } = require("../controllers/whatsappController");
const { requireAuth } = require("../middleware/requireAuth");

// WhatsApp notification routes
router.post("/payment/:orderId",sendPaymentWhatsApp);

module.exports = router; 