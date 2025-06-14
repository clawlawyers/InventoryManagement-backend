const express = require("express");
const router = express.Router();
const {
  getInventoryByCompanyId,
  getCompanyById,
  createCompany,
  deleteCompany,
} = require("../controllers/companyController");
const {
  uploadInventoryExcel,
  mapInventoryExcel,
} = require("../controllers/inventoryExcelController");
const { requireAuth } = require("../middleware/requireAuth");
const upload = require("../middleware/upload");
const Company = require("../models/Company");

// Company routes

router.post("/create", requireAuth, createCompany);
router.get("/:id/inventory", getInventoryByCompanyId);
router.get("/:id", getCompanyById);

router.delete("/:id", requireAuth, deleteCompany);

// Middleware to log route params
const logParams = (req, res, next) => {
  console.log("Company route params:", req.params);
  console.log("Company ID from params:", req.params.companyId);
  next();
};

// Test endpoint to check company ID
router.get("/:companyId/test", async (req, res) => {
  try {
    const companyId = req.params.companyId;
    console.log("Test endpoint - Company ID:", companyId);

    const company = await Company.findById(companyId);
    if (!company) {
      console.log("Test endpoint - Company not found");
      return res.status(404).json({
        message: "Company not found",
        requestedId: companyId,
      });
    }

    console.log("Test endpoint - Company found:", company.name);
    res.json({
      message: "Company found",
      company: {
        id: company._id,
        name: company.name,
      },
    });
  } catch (error) {
    console.error("Test endpoint - Error:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/:companyId/upload-inventory",
  logParams,
  upload.single("excelFile"),
  uploadInventoryExcel
);

// New route for mapping Excel columns to inventory fields
router.post(
  "/:companyId/map-inventory",
  logParams,
  upload.single("excelFile"),
  mapInventoryExcel
);

module.exports = router;
