const express = require("express");
const router = express.Router();
const {
  getAllManagers,
  getCompaniesByManager,
  createManager,
  getManagerById,
  editManagerDetails,
  updateManagerWallet, // Import the new function
  getManagerWalletDetails,
} = require("../controllers/managerController");

// Manager routes
router.get("/", getAllManagers);
router.get("/:id/companies", getCompaniesByManager);
router.get("/:id", getManagerById);
router.post("/", createManager);
router.patch("/:id", editManagerDetails);
router.patch("/:managerId/wallet", updateManagerWallet); // New route for updating wallet
router.get("/wallet/:id", getManagerWalletDetails);

module.exports = router;
