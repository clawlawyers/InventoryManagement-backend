const Company = require("../models/company");

// POST: Get inventories by company ID
const getInventoriesByCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    const company = await Company.findById(companyId).populate("inventories");

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company.inventories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getInventoriesByCompany,
};
