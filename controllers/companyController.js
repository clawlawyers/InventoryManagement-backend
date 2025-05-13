const Company = require("../models/Company");
const Inventory = require("../models/Inventory");

// GET: Get inventories by company ID
const getInventoriesByCompanyId = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId).populate("inventories");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company.inventories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET: Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getInventoriesByCompanyId,
  getCompanyById,
};
