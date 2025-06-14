const Admin = require("../models/Admin");
const Manager = require("../models/Manager");
const TempManager = require("../models/TempManager");
const Salesman = require("../models/Salesman");
const Company = require("../models/Company"); // Import Company model
const bcrypt = require("bcrypt");
const nodemailer = require("../utils/nodemailer");

// Get all Salesmen (inheriting functionality)
exports.getAllSalesmen = async (req, res) => {
  try {
    const salesmen = await Salesman.find();
    res.status(200).json(salesmen);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all Managers (inheriting functionality)
exports.getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.find();
    res.status(200).json(managers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all pending temporary manager registrations (for admin)
exports.getPendingTempManagerRegistrations = async (req, res) => {
  try {
    const pendingManagers = await TempManager.find({ status: false }).sort({
      submittedAt: -1,
    });
    res.status(200).json(pendingManagers);
  } catch (error) {
    console.error(
      "Error fetching pending temporary manager registrations:",
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

// Approve temporary manager registration (for admin)
exports.approveTempManagerRegistration = async (req, res) => {
  try {
    const { tempManagerId } = req.params;
    const { password } = req.body;
    const adminId = req.user.id; // Assuming admin is authenticated

    // Call the approveManagerRegistration from tempManagerController
    // This is a simplified call, in a real scenario you might need to pass req, res or refactor tempManagerController
    // For now, we'll simulate the logic here or assume tempManagerController functions are directly callable
    const tempManager = await TempManager.findById(tempManagerId);
    if (!tempManager) {
      return res
        .status(404)
        .json({ message: "Temporary registration not found" });
    }

    if (tempManager.status === true) {
      return res.status(400).json({ message: "Registration already approved" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const manager = new Manager({
      name: tempManager.name,
      email: tempManager.email,
      phoneNumber: tempManager.phoneNumber,
      password: hashedPassword,
      GSTNumber: tempManager.GSTNumber,
      organisationName: tempManager.organisationName,
    });
    await manager.save();

    tempManager.status = true;
    tempManager.approvedAt = new Date();
    tempManager.approvedBy = adminId;
    await tempManager.save();

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

    res
      .status(200)
      .json({
        message: "Temporary manager registration approved successfully",
      });
  } catch (error) {
    console.error("Error approving temporary manager registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reject temporary manager registration (for admin)
exports.rejectTempManagerRegistration = async (req, res) => {
  try {
    const { tempManagerId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = req.user.id;

    const tempManager = await TempManager.findById(tempManagerId);
    if (!tempManager) {
      return res
        .status(404)
        .json({ message: "Temporary registration not found" });
    }

    if (tempManager.status === true) {
      return res.status(400).json({ message: "Registration already approved" });
    }

    tempManager.status = false; // Keep as false for rejected
    tempManager.rejectionReason = rejectionReason;
    tempManager.approvedBy = adminId;
    await tempManager.save();

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

    res
      .status(200)
      .json({
        message: "Temporary manager registration rejected successfully",
      });
  } catch (error) {
    console.error("Error rejecting temporary manager registration:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get companies by manager (for admin to view manager's companies)
exports.getCompaniesByManager = async (req, res) => {
  try {
    const managerId = req.params.id;
    const manager = await Manager.findById(managerId).populate("companies");

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.json(manager.companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get manager by ID (for admin to view manager details)
exports.getManagerById = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.json(manager);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new manager (for admin to create managers)
exports.createManager = async (req, res) => {
  try {
    const manager = new Manager(req.body);
    await manager.save();
    res.status(201).json(manager);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Edit manager details (for admin to edit manager details)
exports.editManagerDetails = async (req, res) => {
  try {
    const updatedData = req.body;
    const managerId = req.params.id;
    const manager = await Manager.findByIdAndUpdate(managerId, updatedData, {
      new: true,
    });
    res.json(manager);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
