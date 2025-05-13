const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getInventoriesByCompanyId,
  getCompanyById,
} = require("../controllers/companyController");
const {
  uploadInventoryExcel,
} = require("../controllers/inventoryExcelController");

// Company routes
router.get("/:id", getCompanyById);
router.get("/:id/inventories", getInventoriesByCompanyId);

// Excel upload route
router.post(
  "/:companyId/upload-inventory",
  upload.single("excelFile"),
  uploadInventoryExcel
);

module.exports = router;
