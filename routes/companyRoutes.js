const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  uploadInventoryExcel,
} = require("../controllers/inventoryExcelController");

// Add this new route
router.post(
  "/:companyId/upload-inventory",
  upload.single("excelFile"),
  uploadInventoryExcel
);

module.exports = router;
