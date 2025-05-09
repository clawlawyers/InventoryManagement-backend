const express = require("express");
const router = express.Router();
const { getAllManagers, getCompaniesByManager } = require("../controllers/managerController");

// Manager routes
router.get("/", getAllManagers);
router.post("/companies", getCompaniesByManager);

module.exports = router;
