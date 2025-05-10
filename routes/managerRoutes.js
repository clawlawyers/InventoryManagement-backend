const express = require("express");
const router = express.Router();
const {
  getAllManagers,
  getCompaniesByManager,
  createManager,
} = require("../controllers/managerController");

// Manager routes
router.get("/", getAllManagers);
router.get("/companies", getCompaniesByManager);
router.post("/", createManager);

module.exports = router;
