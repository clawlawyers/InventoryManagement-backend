const express = require("express");
const router = express.Router();

const {
  getAllManagers,
  getCompaniesByManager,
  getInventoriesByCompany,
} = require("../controllers/controller");

router.get("/managers", getAllManagers);
router.post("/companies", getCompaniesByManager);
router.post("/inventories", getInventoriesByCompany);

module.exports = router;
