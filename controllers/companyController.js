const Company = require("../models/Company");
const Inventory = require("../models/Inventory");
const Salesman = require("../models/Salesman");
const Manager = require("../models/Manager");
const Client = require("../models/Client");
const Permission = require("../models/permissions");
const InventoryProduct = require("../models/InventoryProduct");

const deleteCompany = async (req, res) => {
  try {
    const companyId = req.params.id;

    // Find the company first to check if it exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Find all salesmen associated with this company
    const salesmen = await Salesman.find({
      manager: {
        $in: await Manager.find({ companies: companyId }).select("_id"),
      },
    });

    // Get all salesman IDs
    const salesmanIds = salesmen.map((salesman) => salesman._id);

    // Delete all clients associated with these salesmen
    await Client.deleteMany({ salesman: { $in: salesmanIds } });

    // Delete all permissions associated with these salesmen
    await Permission.deleteMany({ salesman: { $in: salesmanIds } });

    // Delete all salesmen
    await Salesman.deleteMany({ _id: { $in: salesmanIds } });

    // Delete inventory and inventory products if they exist
    if (company.inventory) {
      const inventory = await Inventory.findById(company.inventory);
      if (inventory && inventory.products && inventory.products.length > 0) {
        await InventoryProduct.deleteMany({ _id: { $in: inventory.products } });
      }
      await Inventory.findByIdAndDelete(company.inventory);
    }

    // Remove company from all managers' companies arrays
    await Manager.updateMany(
      { companies: companyId },
      { $pull: { companies: companyId } }
    );

    // Finally delete the company
    await Company.findByIdAndDelete(companyId);

    res.json({ message: "Company and all related data deleted successfully" });
  } catch (err) {
    console.error("Error deleting company:", err);
    res.status(500).json({ message: err.message });
  }
};

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
  deleteCompany,
};
