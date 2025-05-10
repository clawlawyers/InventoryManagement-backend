const express = require("express");
const router = express.Router();
const {
  getAllManagers,
  getCompaniesByManager,
  createManager,
  getManagerById,
} = require("../controllers/managerController");

// Manager routes
router.get("/", getAllManagers);
router.get("/companies", getCompaniesByManager);
router.get("/:id", getManagerById);
router.post("/", createManager);

module.exports = router;
