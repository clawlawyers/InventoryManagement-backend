const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Manager = require("../models/manager");
const Company = require("../models/company");
const Inventory = require("../models/inventory");
const Salesman = require("../models/Salesman");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected for seeding"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Sample data
const sampleManagers = [
  {
    name: "John Smith",
    email: "john@example.com",
    password: "password123",
  },
  {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    password: "password123",
  },
  {
    name: "Michael Brown",
    email: "michael@example.com",
    password: "password123",
  },
];

const sampleCompanies = [
  { name: "Textile Solutions Inc." },
  { name: "Fabric World Ltd." },
  { name: "Cotton Masters Co." },
  { name: "Silk Road Textiles" },
  { name: "Modern Fabrics" },
];

const sampleSalesmen = [
  {
    user_id: "SM001",
    name: "Robert Wilson",
    user_type: "salesman",
    permissions: ["view_inventory", "create_order"],
    password: "password123",
  },
  {
    user_id: "SM002",
    name: "Lisa Chen",
    user_type: "salesman",
    permissions: ["view_inventory", "create_order", "view_reports"],
    password: "password123",
  },
  {
    user_id: "SM003",
    name: "David Garcia",
    user_type: "salesman",
    permissions: ["view_inventory"],
    password: "password123",
  },
];

// Function to generate random inventory items
const generateInventoryItems = (companyIds) => {
  const items = [];
  const categories = ["CTN", "SLK", "PLY", "WOL", "LNN"]; // Cotton, Silk, Polyester, Wool, Linen

  companyIds.forEach((companyId) => {
    // Generate 3-5 inventory items per company
    const itemCount = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < itemCount; i++) {
      const categoryCode =
        categories[Math.floor(Math.random() * categories.length)];
      const bailNumber = `B${String(Math.floor(Math.random() * 10000)).padStart(
        4,
        "0"
      )}`;
      const lotNumber = `L${String(Math.floor(Math.random() * 1000)).padStart(
        3,
        "0"
      )}`;

      items.push({
        bail_number: bailNumber,
        bail_date: new Date(
          Date.now() - Math.floor(Math.random() * 10000000000)
        ),
        category_code: categoryCode,
        lot_number: lotNumber,
        stock_amount: Math.floor(Math.random() * 1000) + 100,
        company: companyId,
      });
    }
  });

  return items;
};

// Seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await Manager.deleteMany({});
    await Company.deleteMany({});
    await Inventory.deleteMany({});
    await Salesman.deleteMany({});

    console.log("Cleared existing data");

    // Insert managers
    const managers = await Manager.insertMany(sampleManagers);
    console.log(`Added ${managers.length} managers`);

    // Insert companies and associate with managers
    const companies = [];

    for (let i = 0; i < sampleCompanies.length; i++) {
      const company = new Company(sampleCompanies[i]);
      await company.save();
      companies.push(company);

      // Assign company to a random manager
      const randomManager =
        managers[Math.floor(Math.random() * managers.length)];
      randomManager.companies.push(company._id);
      await randomManager.save();
    }

    console.log(`Added ${companies.length} companies`);

    // Insert salesmen and associate with managers
    const salesmen = await Salesman.insertMany(sampleSalesmen);

    for (const salesman of salesmen) {
      // Assign salesman to a random manager
      const randomManager =
        managers[Math.floor(Math.random() * managers.length)];
      randomManager.salesmen.push(salesman._id);
      await randomManager.save();
    }

    console.log(`Added ${salesmen.length} salesmen`);

    // Generate and insert inventory items
    const companyIds = companies.map((company) => company._id);
    const inventoryItems = generateInventoryItems(companyIds);
    const inventories = await Inventory.insertMany(inventoryItems);

    // Associate inventory items with companies
    for (const inventory of inventories) {
      const company = await Company.findById(inventory.company);
      company.inventories.push(inventory._id);
      await company.save();
    }

    console.log(`Added ${inventories.length} inventory items`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
