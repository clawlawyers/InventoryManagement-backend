const Manager = require("../models/manager");
const Salesman = require("../models/Salesman");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Manager login
const managerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const manager = await Manager.findOne({ email });

    if (!manager || !(await bcrypt.compare(password, manager.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: manager._id, type: "manager" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: manager._id, name: manager.name, type: "manager" },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

    const salesman = await Salesman.findOne({ user_id });

    if (!salesman || salesman.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: salesman._id, type: "salesman" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: salesman._id, name: salesman.name, type: "salesman" },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Manager signup
const managerSignup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
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
      companies: [],
      salesmen: [],
    });

    await manager.save();

    // Generate token for immediate login
    const token = jwt.sign(
      { id: manager._id, type: "manager" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Manager account created successfully",
      token,
      user: {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        type: "manager",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  managerLogin,
  salesmanLogin,
  managerSignup,
};
