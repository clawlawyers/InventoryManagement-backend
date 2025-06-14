const express = require("express");
const router = express.Router();
const {
  submitManagerRegistration,
  getPendingRegistrations,
  approveManagerRegistration,
  rejectManagerRegistration,
  getRegistrationStatus,
} = require("../controllers/tempManagerController");
const { requireAuth } = require("../middleware/requireAuth");

// Public routes
router.post("/submit", submitManagerRegistration);
router.get("/status/:email", getRegistrationStatus);

// Admin only routes (require authentication)
router.get("/pending", requireAuth, getPendingRegistrations);
router.post("/approve/:tempManagerId", requireAuth, approveManagerRegistration);
router.post("/reject/:tempManagerId", requireAuth, rejectManagerRegistration);

module.exports = router;
