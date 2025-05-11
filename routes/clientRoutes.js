const express = require("express");
const router = express.Router();
const {
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");

// Client routes
router.get("/", getAllClients);
router.get("/:id", getClientById);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

module.exports = router;
