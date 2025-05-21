const express = require("express");
const router = express.Router();
const { getAllInvoices, createInvoice } = require("../controllers/InvoiceController");
const { requireAuth } = require("../middleware/requireAuth");

// Invoice routes
router.get("/", requireAuth, getAllInvoices);
router.post("/", requireAuth, createInvoice);

module.exports = router;
