const Salesman = require("../models/Salesman");
const Permission = require("../models/permissions");
const Manager = require("../models/Manager");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const permissions = require("../models/permissions");

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

const updatePermissions = async (req, res) => {
  try {
    const { salesmanId } = req.params;
    const { permissions } = req.body;

    // Find the salesman
    const salesman = await Salesman.findById(salesmanId);
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    // Update the permissions
    await Permission.findByIdAndUpdate(salesman.permissions, permissions);

    res.json({ message: "Permissions updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPermissions = async (req, res) => {
  try {
    const { salesmanId } = req.params;

    const SelsPremissions = await permissions.findOne({ salesman: salesmanId });

    res.json(SelsPremissions);
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create a new salesman
const createSalesman = async (req, res) => {
  try {
    console.log(req.body);
    const { name, email, phone, managerId } = req.body;

    if (!name || !phone || !managerId || !email) {
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

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create default permissions
    const permission = new Permission({
      deleteClient: false,
      addClient: false,
      generateInvoice: false,
      viewInventory: true,
      editInventory: false,
      description: "Default permissions",
    });

    await permission.save();

    // Create the salesman
    const salesman = new Salesman({
      email,
      user_id,
      name,
      phone,
      password: hashedPassword,
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
        user_type: salesman.user_type,
      },
    });
  } catch (err) {
    console.log(err);
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
      populate: {
        path: "permissions",
        model: "Permission",
      },
    });

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.json(manager.salesmen);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

const deleteSalesman = async (req, res) => {
  try {
    const salesmanId = req.params.salesmanId;

    // Find the salesman first to get related data
    const salesman = await Salesman.findById(salesmanId);
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    // Remove salesman from manager's salesmen array
    await Manager.findByIdAndUpdate(salesman.manager, {
      $pull: { salesmen: salesmanId },
    });

    // Delete associated permissions
    await Permission.findByIdAndDelete(salesman.permissions);

    // Delete the salesman
    await Salesman.findByIdAndDelete(salesmanId);

    res.json({ message: "Salesman deleted successfully", salesman });
  } catch (error) {
    console.error("Error deleting salesman:", error);
    res.status(500).json({ message: error.message });
  }
};

const getSalesman = async (req, res) => {
  try {
    const salesman = await Salesman.findById(req.params.salesmanId);
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }
    res.json(salesman);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateSalesman = async (req, res) => {
  try {
    const salesmanId = req.params.salesmanId;
    const updateData = req.body;

    const updatedSalesman = await Salesman.findByIdAndUpdate(
      salesmanId,
      updateData,
      { new: true }
    );

    if (!updatedSalesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    res.json(updatedSalesman);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createSalesman,
  getAllSalesmen,
  getSalesmenByManager,
  updatePermissions,
  getPermissions,
  deleteSalesman,
  getSalesman,
  updateSalesman,
};
