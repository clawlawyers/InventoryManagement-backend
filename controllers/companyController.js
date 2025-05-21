const Company = require("../models/Company");
const Inventory = require("../models/Inventory");

// GET: Get inventories by company ID
const getInventoryByCompanyId = async (req, res) => {
  try {
    const companyId = req.params.id;
    // const company = await Company.findById(companyId).populate("inventory");
    const company = await Company.findById(companyId).populate({
      path: "inventory",
      populate: {
        path: "products",
        model: "InventoryProduct",
      },
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company.inventory);
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

const createCompany = async (req, res) => {
  try {
    console.log("req is coming");
    if (req.user.type !== "manager") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, address, GSTNumber } = req.body;
    const newCompany = new Company({
      name,
      address,
      GSTNumber,
    });
    await newCompany.save();
    req.user.user.companies.push(newCompany._id);
    await req.user.user.save();
    res.status(201).json(newCompany);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  getInventoryByCompanyId,
  getCompanyById,
  createCompany,
};
