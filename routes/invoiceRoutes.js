const express = require("express");
const router = express.Router();
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  downloadInvoicePDF,
  generatePDFForPayment,
} = require("../controllers/InvoiceController");
const { requireAuth } = require("../middleware/requireAuth");

// Invoice routes
router.get("/", requireAuth, getAllInvoices); // Get all invoices
router.get("/:id", requireAuth, getInvoiceById); // Get invoice by ID
router.post("/", requireAuth, createInvoice); // Create invoice manually (for testing)
router.put("/:id/status", requireAuth, updateInvoiceStatus); // Update invoice status
router.get("/:id/pdf", requireAuth, downloadInvoicePDF);
router.get("/:id/download", requireAuth, downloadInvoicePDF);

// Test routes (without auth for testing)
router.get("/test/all", getAllInvoices); // Test route for getting all invoices
router.get("/test/:id", getInvoiceById); // Test route for getting invoice by ID
router.get("/test/:id/download", downloadInvoicePDF); // Added test route for PDF download

// Generate PDF for a payment
router.post("/generate-pdf/:paymentId", requireAuth, generatePDFForPayment);

module.exports = router;
