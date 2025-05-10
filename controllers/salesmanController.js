const Salesman = require("../models/Salesman");
const Permission = require("../models/permissions");
const Manager = require("../models/manager");
const crypto = require("crypto");

// Generate a random user ID with prefix SM followed by 4 digits
const generateUserId = async () => {
  let isUnique = false;
  let userId;

  while (!isUnique) {
    // Generate a random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    userId = `SM${randomNum}`;

    // Check if this ID already exists
    const existingSalesman = await Salesman.findOne({ user_id: userId });
    if (!existingSalesman) {
      isUnique = true;
    }
  }

  return userId;
};

// Generate a random password (8 characters)
const generatePassword = () => {
  return crypto.randomBytes(4).toString("hex");
};

// Create a new salesman
const createSalesman = async (req, res) => {
  try {
    const { name, phone, managerId } = req.body;

    if (!name || !phone || !managerId) {
      return res.status(400).json({
        message: "Name, phone number, and manager ID are required",
      });
    }

    // Check if manager exists
    const manager = await Manager.findById(managerId);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    // Check if phone number is already in use
    const existingSalesman = await Salesman.findOne({ phone });
    if (existingSalesman) {
      return res.status(400).json({
        message: "Phone number is already registered to another salesman",
      });
    }

    // Generate user ID and password
    const user_id = await generateUserId();
    const password = generatePassword();

    // Create default permissions
    const permission = new Permission({
      add: false,
      delete: false,
      description: "Default permissions",
    });

    await permission.save();

    // Create the salesman
    const salesman = new Salesman({
      user_id,
      name,
      phone,
      password,
      permissions: permission._id,
      manager: managerId,
    });

    // Save the salesman
    await salesman.save();

    // Update the permission with the salesman reference
    permission.salesman = salesman._id;
    await permission.save();

    // Add salesman to manager's salesmen array
    manager.salesmen.push(salesman._id);
    await manager.save();

    // Return the salesman with generated credentials
    res.status(201).json({
      message: "Salesman created successfully",
      salesman: {
        _id: salesman._id,
        name: salesman.name,
        phone: salesman.phone,
        user_id: salesman.user_id,
        password: salesman.password, // Include password in response so manager can share it
        user_type: salesman.user_type,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all salesmen
const getAllSalesmen = async (req, res) => {
  try {
    const salesmen = await Salesman.find().select("-password");
    res.json(salesmen);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get salesmen by manager ID
const getSalesmenByManager = async (req, res) => {
  try {
    const { managerId } = req.params;

    const manager = await Manager.findById(managerId).populate({
      path: "salesmen",
      select: "-password", // Exclude password from results
    });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.json(manager.salesmen);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSalesman,
  getAllSalesmen,
  getSalesmenByManager,
};
