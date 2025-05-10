const Manager = require("../models/manager");

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
const getCompaniesByManager = async (req, res) => {
  try {
    const { managerId } = req.body;
    const manager = await Manager.findById(managerId).populate("companies");

    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    res.json(manager.companies);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllManagers,
  getCompaniesByManager,
  createManager,
};
