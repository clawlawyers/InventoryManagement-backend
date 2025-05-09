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

// POST: Get companies by manager ID
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
};
