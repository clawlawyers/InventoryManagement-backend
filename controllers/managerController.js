const Manager = require("../models/Manager");

// GET all managers
const getAllManagers = async (req, res) => {
  try {
    const managers = await Manager.find();
    res.json(managers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createManager = async (req, res) => {
  try {
    const manager = new Manager(req.body);
    await manager.save();
    res.status(201).json(manager);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
const createSalesman = async (req, res) => {
  try {
    const salesman = new Salesman(req.body);
    await salesman.save();
    res.status(201).json(salesman);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
const getCompaniesByManager = async (req, res) => {
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

// Make sure getManagerById is defined
const getManagerById = async (req, res) => {
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

const editManagerDetails = async (req, res) => {
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

const updateManagerWallet = async (req, res) => {
  try {
    const { managerId } = req.params;
    const { coins, plan } = req.body;

    if (typeof coins !== "number" || coins < 0) {
      return res.status(400).json({
        message: "Invalid coins amount. Must be a non-negative number.",
      });
    }

    if (plan && !["custom", "monthly"].includes(plan)) {
      return res
        .status(400)
        .json({ message: "Invalid plan. Must be 'custom' or 'monthly'." });
    }

    const manager = await Manager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    manager.wallet.coins += coins;
    if (plan) {
      manager.wallet.plan = plan;
      manager.wallet.planStartDate = new Date();
    }

    // Check if monthly plan has expired
    if (manager.wallet.plan === "monthly" && manager.wallet.planStartDate) {
      const startDate = new Date(manager.wallet.planStartDate);
      const expiryDate = new Date(startDate.setDate(startDate.getDate() + 30));
      const currentDate = new Date();

      if (currentDate > expiryDate) {
        return res.status(400).json({ message: "Monthly plan has expired." });
      }
    }

    await manager.save();

    res.status(200).json({
      message: "Manager wallet updated successfully",
      wallet: manager.wallet,
    });
  } catch (error) {
    console.error("Error updating manager wallet:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Make sure it's included in the exports
const getManagerWalletDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const manager = await Manager.findById(id);

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.status(200).json({ wallet: manager.wallet });
  } catch (error) {
    console.error("Error fetching manager wallet details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getAllManagers,
  getCompaniesByManager,
  createManager,
  getManagerById,
  editManagerDetails,
  updateManagerWallet,
  getManagerWalletDetails,
};
