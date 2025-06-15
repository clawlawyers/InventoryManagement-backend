const express = require("express");
const router = express.Router();
const {
  managerLogin,
  salesmanLogin,
  managerSignup,
  getVerify,
  accountCreatationRequest,
  getVerifyUser,
  getPendingRegistrations,
  approveTempUser, // Added approveTempUser
} = require("../controllers/authController");
const deleteManagerRequest = require("../models/deleteManagerRequest");

// Auth routes
router.post("/manager/login", managerLogin);
router.post("/manager/signup", managerSignup);
router.get("/getVerify", getVerify);
router.get("/getVerifyUser", getVerifyUser);
router.post("/salesman/login", salesmanLogin);
router.post("/accountCreatationRequest", accountCreatationRequest);
router.get("/getPendingManagers", getPendingRegistrations);
router.post("/approve-temp-user/:tempManagerId", approveTempUser); // New route for approving temporary managers

// POST /api/delete-manager-request
router.post("/delete-manager-request", async (req, res) => {
  try {
    const { name, email, phoneNumber } = req.body;

    if (!name || !email || !phoneNumber) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newRequest = new deleteManagerRequest({ name, email, phoneNumber });
    await newRequest.save();

    res
      .status(201)
      .json({ message: "Request submitted successfully.", data: newRequest });
  } catch (error) {
    console.error("Error creating delete manager request:", error);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
