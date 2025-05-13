const express = require("express");
const router = express.Router();
const {
  createSalesman,
  getAllSalesmen,
  getSalesmenByManager,
} = require("../controllers/salesmanController");

const {
  createClient,
  getClientsBySalesman,
} = require("../controllers/clientController");

const {
  uploadExcelFile,
  getExcelUploads,
} = require("../controllers/excelController");

const upload = require("../middleware/upload");

// Salesman routes
router.post("/", createSalesman);
router.get("/", getAllSalesmen);
router.get("/manager/:managerId", getSalesmenByManager);

// Client routes (related to salesmen)
router.post("/:salesmanId/clients", createClient);
router.get("/:salesmanId/clients", getClientsBySalesman);

// Excel upload routes
router.post("/:salesmanId/upload", upload.single("excelFile"), uploadExcelFile);
router.get("/:salesmanId/uploads", getExcelUploads);

module.exports = router;
