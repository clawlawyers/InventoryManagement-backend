const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const Manager = require("../models/manager");
const Company = require("../models/company");
const Inventory = require("../models/inventory");
const Salesman = require("../models/Salesman");
const Client = require("../models/Client");
const Permission = require("../models/permissions");

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
    phone: "555-123-4567",
    password: "password123",
  },
  {
    user_id: "SM002",
    name: "Lisa Chen",
    user_type: "salesman",
    phone: "555-234-5678",
    password: "password123",
  },
  {
    user_id: "SM003",
    name: "David Garcia",
    user_type: "salesman",
    phone: "555-345-6789",
    password: "password123",
  },
];

// Sample clients data
const generateSampleClients = (salesmanIds) => {
  const clients = [];
  const cities = [
    "New York",
    "Los Angeles",
    "Chicago",
    "Houston",
    "Phoenix",
    "Philadelphia",
    "San Antonio",
    "San Diego",
  ];
  const states = ["NY", "CA", "IL", "TX", "AZ", "PA", "TX", "CA"];

  // Generate 3-5 clients per salesman
  salesmanIds.forEach((salesmanId, index) => {
    const clientCount = Math.floor(Math.random() * 3) + 3; // 3-5 clients

    for (let i = 0; i < clientCount; i++) {
      const cityIndex = Math.floor(Math.random() * cities.length);
      clients.push({
        name: `Client ${index + 1}-${i + 1}`,
        phone: `555-${String(Math.floor(100 + Math.random() * 900))}-${String(
          Math.floor(1000 + Math.random() * 9000)
        )}`,
        email: `client${index + 1}${i + 1}@example.com`,
        address: `${Math.floor(100 + Math.random() * 9900)} Main St`,
        city: cities[cityIndex],
        state: states[cityIndex],
        zipCode: String(Math.floor(10000 + Math.random() * 90000)),
        notes: `Notes for client ${index + 1}-${i + 1}`,
        salesman: salesmanId,
      });
    }
  });

  return clients;
};

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
    await Client.deleteMany({});
    await Permission.deleteMany({});

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

    // Create salesmen with permissions and associate with managers
    const salesmen = [];

    for (const salesmanData of sampleSalesmen) {
      // Create permission for salesman
      const permission = new Permission({
        add: Math.random() > 0.5,
        delete: Math.random() > 0.7,
        description: `Permissions for ${salesmanData.name}`,
      });
      await permission.save();

      // Create salesman
      const salesman = new Salesman({
        ...salesmanData,
        permissions: permission._id,
        manager: managers[Math.floor(Math.random() * managers.length)]._id,
      });

      await salesman.save();
      salesmen.push(salesman);

      // Update permission with salesman reference
      permission.salesman = salesman._id;
      await permission.save();

      // Assign salesman to manager
      const manager = await Manager.findById(salesman.manager);
      manager.salesmen.push(salesman._id);
      await manager.save();
    }

    console.log(`Added ${salesmen.length} salesmen with permissions`);

    // Generate and insert clients
    const salesmanIds = salesmen.map((salesman) => salesman._id);
    const clientsData = generateSampleClients(salesmanIds);
    const clients = await Client.insertMany(clientsData);

    console.log(`Added ${clients.length} clients`);

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
