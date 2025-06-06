const Company = require("../models/Company");
const Inventory = require("../models/Inventory");
const InventoryProduct = require("../models/InventoryProduct");
const {
  generateInventoryCSV,
  generateProductCSV,
} = require("../utils/csvGenerator");
const {
  generateInventoryPDF,
  generateProductPDF,
} = require("../utils/pdfGenerator");

const createInventory = async (req, res) => {
  try {
    const { inventoryName, companyId } = req.body;

    // Check if company belongs to the manager
    // const companyExists = req.user.user.companies.includes(companyId);
    // if (!companyExists) {
    //   return res.status(403).json({
    //     message: "Forbidden: Company does not belong to this manager",
    //   });
    // }

    const newInventory = new Inventory({
      inventoryName,
      company: companyId,
    });

    await newInventory.save();
    const updateCompany = await Company.findByIdAndUpdate(
      companyId,
      { inventory: newInventory._id },
      { new: true }
    );

    res.status(201).json(updateCompany);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getProductByProductId = async (req, res) => {
  try {
    console.log("Req is coming");
    // if (req.user.type !== "manager") {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }
    const inventoryId = req.params.id;

    console.log(inventoryId);
    const inventory = await Inventory.findById(inventoryId).populate(
      "products"
    );

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res.json(inventory.products);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Download inventory as CSV
const downloadInventoryCSV = async (req, res) => {
  try {
    const inventoryId = req.params.id;

    // Get inventory with populated products and company
    const inventory = await Inventory.findById(inventoryId)
      .populate("products")
      .populate("company");

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // Generate CSV
    const csvResult = generateInventoryCSV(inventory, inventory.products);

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${csvResult.filename}"`
    );
    res.setHeader("Content-Length", csvResult.size);

    // Send the CSV buffer
    res.send(csvResult.buffer);
  } catch (error) {
    console.error("❌ Error downloading inventory CSV:", error);
    res
      .status(500)
      .json({ message: "Error generating CSV", error: error.message });
  }
};

// Download inventory as PDF
const downloadInventoryPDF = async (req, res) => {
  try {
    const inventoryId = req.params.id;

    // Get inventory with populated products and company
    const inventory = await Inventory.findById(inventoryId)
      .populate("products")
      .populate("company");

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // Generate PDF
    const pdfResult = await generateInventoryPDF(
      inventory,
      inventory.products,
      inventory.company
    );

    // Set headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfResult.filename}"`
    );
    res.setHeader("Content-Length", pdfResult.size);

    // Send the PDF buffer
    res.send(pdfResult.buffer);
  } catch (error) {
    console.error("❌ Error downloading inventory PDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

// Download single product as CSV
const downloadProductCSV = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Get product
    const product = await InventoryProduct.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Generate CSV
    const csvResult = generateProductCSV(product);

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${csvResult.filename}"`
    );
    res.setHeader("Content-Length", csvResult.size);

    // Send the CSV buffer
    res.send(csvResult.buffer);
  } catch (error) {
    console.error("❌ Error downloading product CSV:", error);
    res
      .status(500)
      .json({ message: "Error generating CSV", error: error.message });
  }
};

// Download single product as PDF
const downloadProductPDF = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Get product
    const product = await InventoryProduct.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Generate PDF
    const pdfResult = await generateProductPDF(product);

    // Set headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdfResult.filename}"`
    );
    res.setHeader("Content-Length", pdfResult.size);

    // Send the PDF buffer
    res.send(pdfResult.buffer);
  } catch (error) {
    console.error("❌ Error downloading product PDF:", error);
    res
      .status(500)
      .json({ message: "Error generating PDF", error: error.message });
  }
};

module.exports = {
  createInventory,
  getProductByProductId,
  downloadInventoryCSV,
  downloadInventoryPDF,
  downloadProductCSV,
  downloadProductPDF,
};
