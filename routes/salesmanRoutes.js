const express = require("express");
const router = express.Router();
const {
  createSalesman,
  getAllSalesmen,
  getSalesmenByManager,
  updatePermissions,
  getPermissions,
  deleteSalesman,
  getSalesman,
  updateSalesman,
} = require("../controllers/salesmanController");

const {
  createClient,
  getClientsBySalesman,
} = require("../controllers/clientController");

// Salesman routes
router.post("/", createSalesman);
router.get("/", getAllSalesmen);
router.get("/manager/:managerId", getSalesmenByManager);

router.put("/:salesmanId/updatePermissions", updatePermissions);

router.get("/:salesmanId/getPermissions", getPermissions);

// Client routes (related to salesmen)
router.post("/:salesmanId/clients", createClient);
router.get("/:salesmanId/clients", getClientsBySalesman);

router.delete("/:salesmanId", deleteSalesman);
router.get("/:salesmanId", getSalesman);
router.patch("/:salesmanId", updateSalesman);
// This route is now handled in companyRoutes.js
// Removing to avoid route conflict

module.exports = router;
