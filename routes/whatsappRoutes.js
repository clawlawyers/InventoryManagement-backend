const express = require("express");
const router = express.Router();
const {
  sendPaymentWhatsApp,
  testWhatsAppService,
} = require("../controllers/whatsappController");
const { requireAuth } = require("../middleware/requireAuth");

// WhatsApp notification routes
router.post("/payment/:orderId", requireAuth, sendPaymentWhatsApp);
router.get("/test", testWhatsAppService); // Test endpoint (no auth required for testing)

module.exports = router;
