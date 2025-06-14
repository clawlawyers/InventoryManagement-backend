const TempManager = require("../models/TempManager");
const Manager = require("../models/Manager");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("../utils/nodemailer");

// Submit manager registration for approval
const submitManagerRegistration = async (req, res) => {
  try {
    const { name, email, phoneNumber, GSTNumber, organisationName } = req.body;

    // Check if email already exists in TempManager or Manager
    const existingTempManager = await TempManager.findOne({ email });
    const existingManager = await Manager.findOne({ email });

    if (existingTempManager) {
      return res.status(400).json({
        message: "Registration already submitted. Please wait for approval.",
      });
    }

    if (existingManager) {
      return res.status(400).json({
        message: "Manager with this email already exists.",
      });
    }

    // Create temporary manager entry
    const tempManager = new TempManager({
      name,
      email,
      phoneNumber,
      GSTNumber,
      organisationName,
    });

    await tempManager.save();

    // Send notification to admin (you can customize this based on your admin notification system)
    // For now, just return success response
    res.status(201).json({
      message:
        "Registration submitted successfully. You will receive an email once approved.",
      tempManagerId: tempManager._id,
    });
  } catch (error) {
    console.error("Error submitting manager registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all pending manager registrations (for admin)
const getPendingRegistrations = async (req, res) => {
  try {
    const pendingManagers = await TempManager.find({ status: false }).sort({
      submittedAt: -1,
    });

    res.status(200).json(pendingManagers);
  } catch (error) {
    console.error("Error fetching pending registrations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve manager registration
const approveManagerRegistration = async (req, res) => {
  try {
    const { tempManagerId } = req.params;
    const { password } = req.body;
    const adminId = req.user.id; // Assuming admin is authenticated

    if (!password) {
      return res
        .status(400)
        .json({ message: "Password is required for approval" });
    }

    // Find the temporary manager
    const tempManager = await TempManager.findById(tempManagerId);
    if (!tempManager) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (tempManager.status === true) {
      return res
        .status(400)
        .json({ message: "Registration already processed (approved)" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the actual manager
    const manager = new Manager({
      name: tempManager.name,
      email: tempManager.email,
      phoneNumber: tempManager.phoneNumber,
      password: hashedPassword,
      GSTNumber: tempManager.GSTNumber,
      organisationName: tempManager.organisationName,
    });

    await manager.save();

    // Update temp manager status
    tempManager.status = true; // Set to true for approved
    tempManager.approvedAt = new Date();
    tempManager.approvedBy = adminId;
    await tempManager.save();

    // Send approval email with credentials to manager
    try {
      await nodemailer.sendMail({
        to: manager.email,
        subject: "Manager Account Approved - Login Credentials",
        html: `
          <h2>Your Manager Account Has Been Approved!</h2>
          <p>Dear ${manager.name},</p>
          <p>Your manager account has been approved. Here are your login credentials:</p>
          <p><strong>Email:</strong> ${manager.email}</p>
          <p><strong>Password:</strong> ${password}</p>
          <p>Please login and change your password for security purposes.</p>
          <p>Welcome to the team!</p>
        `,
      });
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Don't fail the approval process if email fails
    }

    res.status(200).json({
      message: "Manager registration approved successfully",
      managerId: manager._id,
    });
  } catch (error) {
    console.error("Error approving manager registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject manager registration
const rejectManagerRegistration = async (req, res) => {
  try {
    const { tempManagerId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    const tempManager = await TempManager.findById(tempManagerId);
    if (!tempManager) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (tempManager.status === true) {
      return res
        .status(400)
        .json({ message: "Registration already processed (approved)" });
    }

    // Update temp manager status
    tempManager.status = false; // Keep as false for rejected
    tempManager.rejectionReason = rejectionReason;
    tempManager.approvedBy = adminId;
    await tempManager.save();

    // Send rejection email
    try {
      await nodemailer.sendMail({
        to: tempManager.email,
        subject: "Manager Account Registration - Update",
        html: `
          <h2>Manager Account Registration Update</h2>
          <p>Dear ${tempManager.name},</p>
          <p>We regret to inform you that your manager account registration has been declined.</p>
          ${
            rejectionReason
              ? `<p><strong>Reason:</strong> ${rejectionReason}</p>`
              : ""
          }
          <p>If you have any questions, please contact our support team.</p>
        `,
      });
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
    }

    res.status(200).json({
      message: "Manager registration rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting manager registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get registration status (for manager to check)
const getRegistrationStatus = async (req, res) => {
  try {
    const { email } = req.params;

    const tempManager = await TempManager.findOne({ email });
    if (!tempManager) {
      return res.status(404).json({ message: "Registration not found" });
    }

    res.status(200).json({
      status: tempManager.status,
      submittedAt: tempManager.submittedAt,
      approvedAt: tempManager.approvedAt,
      rejectionReason: tempManager.rejectionReason,
    });
  } catch (error) {
    console.error("Error fetching registration status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  submitManagerRegistration,
  getPendingRegistrations,
  approveManagerRegistration,
  rejectManagerRegistration,
  getRegistrationStatus,
};
