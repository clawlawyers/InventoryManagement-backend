const express = require("express");
const router = express.Router();
const {
  getAllManagers,
  getCompaniesByManager,
  createManager,
  getManagerById,
  editManagerDetails,
} = require("../controllers/managerController");

// Manager routes
router.get("/", getAllManagers);
router.get("/:id/companies", getCompaniesByManager);
router.get("/:id", getManagerById);
router.post("/", createManager);
router.patch("/:id", editManagerDetails);

module.exports = router;
