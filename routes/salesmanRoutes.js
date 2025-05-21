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

// Salesman routes
router.post("/", createSalesman);
router.get("/", getAllSalesmen);
router.get("/manager/:managerId", getSalesmenByManager);

// Client routes (related to salesmen)
router.post("/:salesmanId/clients", createClient);
router.get("/:salesmanId/clients", getClientsBySalesman);
// This route is now handled in companyRoutes.js
// Removing to avoid route conflict

module.exports = router;
