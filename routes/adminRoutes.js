const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Get all Salesmen (inheriting functionality)
router.get("/salesmen", adminController.getAllSalesmen);

// Get all Managers (inheriting functionality)
router.get("/managers", adminController.getAllManagers);

// Admin can get all pending temporary manager registrations
router.get(
  "/temp-managers/pending",
  adminController.getPendingTempManagerRegistrations
);

// Admin can approve a temporary manager registration
router.post(
  "/temp-managers/:tempManagerId/approve",
  adminController.approveTempManagerRegistration
);

// Admin can reject a temporary manager registration
router.post(
  "/temp-managers/:tempManagerId/reject",
  adminController.rejectTempManagerRegistration
);

// Admin can get a specific manager by ID
router.get("/managers/:id", adminController.getManagerById);

// Admin can get companies associated with a specific manager
router.get("/managers/:id/companies", adminController.getCompaniesByManager);

// Admin can create a new manager
router.post("/managers", adminController.createManager);

// Admin can edit manager details
router.patch("/managers/:id", adminController.editManagerDetails);

module.exports = router;
