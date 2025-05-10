const express = require("express");
const router = express.Router();
const {
  createSalesman,
  getAllSalesmen,
  getSalesmenByManager,
} = require("../controllers/salesmanController");

// Salesman routes
router.post("/", createSalesman);
router.get("/", getAllSalesmen);
router.get("/manager/:managerId", getSalesmenByManager);

module.exports = router;
