const express = require("express");
const router = express.Router();
const {
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  createClientByManagerOrSalesman,
} = require("../controllers/clientController");
const { requireAuth } = require("../middleware/requireAuth");

// Client routes
router.post("/create", requireAuth, createClientByManagerOrSalesman);
router.post("/test/create", createClientByManagerOrSalesman);
router.get("/", getAllClients);
router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

module.exports = router;
