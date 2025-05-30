const express = require("express");
const router = express.Router();
const {
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  createClientByManagerOrSalesman,
  getClientsBySalesman,
} = require("../controllers/clientController");
const { requireAuth } = require("../middleware/requireAuth");

// Client routes
router.post("/create", requireAuth, createClientByManagerOrSalesman);
router.post("/test/create", createClientByManagerOrSalesman);
router.get("/", requireAuth, getAllClients);
router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

router.get("/SalesmanClients/:salesmanId", getClientsBySalesman);

module.exports = router;
