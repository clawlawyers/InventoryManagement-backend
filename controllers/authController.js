const Manager = require("../models/Manager");
const Salesman = require("../models/Salesman");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sendEmail = require("../utils/nodemailer");
const TempManager = require("../models/TempManager");

const accountCreatationRequest = async (req, res) => {
  try {
    const { name, email, phoneNumber, GSTNumber, organisationName } = req.body;

    if (!name || !email || !phoneNumber || !GSTNumber || !organisationName) {
      return res.status(400).json({
        message:
          "Name, email, phoneNumber ,GSTNumber and organisationName are required",
      });
    }
    // Check if email is already in use
    const existingTempManager = await TempManager.findOne({ email });
    if (existingTempManager) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Save details to TempManager
    const tempManager = new TempManager({
      name,
      email,
      phoneNumber,
      GSTNumber,
      organisationName,
    });
    await tempManager.save();

    // Send email
    const htmlTemplate = `
      <!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Account Creation Request</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f6f8fa;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      background-color: #ffffff;
      margin: 0 auto;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
    }
    h2 {
      color: #333;
      margin-bottom: 20px;
    }
    .info {
      margin-bottom: 10px;
    }
    .label {
      font-weight: bold;
      color: #555;
    }
    .value {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>New Account Creation Request</h2>
    <div class="info">
      <span class="label">Name:</span>
      <span class="value">${name}</span>
    </div>
    <div class="info">
      <span class="label">Email:</span>
      <span class="value">${email}</span>
    </div>
    <div class="info">
      <span class="label">Phone Number:</span>
      <span class="value">${phoneNumber}</span>
    </div>
    <div class="info">
      <span class="label">GST Number:</span>
      <span class="value">${GSTNumber}</span>
    </div>
    <div class="info">
      <span class="label">Organisation Name:</span>
      <span class="value">${organisationName}</span>
    </div>
  </div>
</body>
</html>
`;
    await sendEmail({
      to: "claw.lawyers@gmail.com",
      subject: "Account Creation Request",
      htmlTemplate,
    });

    res.status(200).json({
      message: "Account creation request sent successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

// Manager login
const managerLogin = async (req, res) => {
  try {
    console.log("request is coming");
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const manager = await Manager.findOne({ email }).populate("companies");

    if (!manager || !(await bcrypt.compare(password, manager.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: manager._id, type: "manager" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    res.json({
      token,
      user: {
        id: manager._id,
        name: manager.name,
        type: "manager",
        email: manager.email,
        phoneNumber: manager.phoneNumber,
        GSTNumber: manager.GSTNumber,
        companies: manager.companies,
        organizationName: manager.organisationName,
        wallet: manager.wallet,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

// Salesman login
const salesmanLogin = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res
        .status(400)
        .json({ message: "User ID and password are required" });
    }

    const salesman = await Salesman.findOne({ user_id })
      .populate("permissions")
      .populate({
        path: "manager",
        populate: {
          path: "companies",
        },
      });

    if (!salesman || !(await bcrypt.compare(password, salesman.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: salesman._id, type: "salesman" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    const organisationName = salesman.manager.organisationName;

    res.json({
      token,
      user: {
        id: salesman._id,
        name: salesman.name,
        type: "salesman",
        email: salesman.email,
        permissions: salesman.permissions,
        organisationName,
        companies: salesman.manager.companies,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Manager signup
const managerSignup = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, GSTNumber, organisationName } =
      req.body;

    if (
      !name ||
      !email ||
      !password ||
      !phoneNumber ||
      !GSTNumber ||
      !organisationName
    ) {
      return res.status(400).json({
        message:
          "Name, email, phoneNumber ,GSTNumber and password are required",
      });
    }

    // Check if email is already in use
    const existingManager = await Manager.findOne({ email });
    if (existingManager) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const manager = new Manager({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      GSTNumber,
      companies: [],
      salesmen: [],
      organisationName,
    });

    await manager.save();

    // Generate token for immediate login
    const token = jwt.sign(
      { id: manager._id, type: "manager" },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    res.status(201).json({
      message: "Manager account created successfully",
      token,
      user: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        type: "manager",
        companies: [],
        wallet: manager.wallet,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getVerify = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === "manager") {
      const manager = await Manager.findById(decoded.id).populate("companies");
      if (!manager) {
        return res.status(401).json({ message: "Token is invalid" });
      }
      console.log({
        token,
        user: {
          id: manager._id,
          name: manager.name,
          type: "manager",
          email: manager.email,
          phoneNumber: manager.phoneNumber,
          GSTNumber: manager.GSTNumber,
          companies: manager.companies,
          organizationName: manager.organisationName,
          wallet: manager.wallet,
        },
      });
    } else if (decoded.type === "salesman") {
      const salesman = await Salesman.findById(decoded.id);
      if (!salesman) {
        return res.status(401).json({ message: "Token is invalid" });
      }
      res.json({
        token,
        user: { id: salesman._id, name: salesman.name, type: "salesman" },
      });
    } else {
      res.status(401).json({ message: "Token is invalid" });
    }
  } catch (error) {
    res.status(401).json({ message: "Token is invalid" });
  }
};

const getVerifyUser = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    if (decoded.type === "salesman") {
      const salesman = await Salesman.findById(decoded.id)
        .populate("permissions")
        .populate({
          path: "manager",
          populate: {
            path: "companies",
          },
        });
      if (!salesman) {
        return res.status(401).json({ message: "Token is invalid" });
      }
      const organisationName = salesman.manager.organisationName;

      res.json({
        token,
        user: {
          id: salesman._id,
          name: salesman.name,
          type: "salesman",
          email: salesman.email,
          permissions: salesman.permissions,
          organisationName,
          companies: salesman.manager.companies,
        },
      });
    } else if (decoded.type === "manager") {
      const salesman = await Salesman.findById(decoded.id);
      if (!salesman) {
        return res.status(401).json({ message: "Token is invalid" });
      }
      res.json({
        token,
        user: { id: salesman._id, name: salesman.name, type: "salesman" },
      });
    } else {
      res.status(401).json({ message: "Token is invalid" });
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Token is invalid" });
  }
};

// Approve a temporary manager/user
const approveTempUser = async (req, res) => {
  try {
    const { tempManagerId } = req.params;

    // Find the temporary manager by ID
    const tempManager = await TempManager.findById(tempManagerId);

    if (!tempManager) {
      return res.status(404).json({ message: "Temporary manager not found" });
    }

    // Set the status to true as per user's feedback
    tempManager.status = true;
    await tempManager.save();

    res.status(200).json({
      message: "Temporary manager approved successfully",
      tempManagerDetails: tempManager,
    });
  } catch (error) {
    console.error("Error approving temporary manager:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  managerLogin,
  salesmanLogin,
  managerSignup,
  getVerify,
  accountCreatationRequest,
  getVerifyUser,
  getPendingRegistrations,
  approveTempUser,
};
