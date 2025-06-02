const { create } = require("../models/Client");
const Inventory = require("../models/Inventory");
const InventoryProduct = require("../models/InventoryProduct");
const mongoose = require("mongoose");

const getInventoryName = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    // Check if inventory exists
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res.json(inventory.inventoryName);
  } catch (err) {
    console.error("Error fetching inventory name:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create a new inventory product manually
const createInventoryProduct = async (req, res) => {
  try {
    const {
      inventoryId,
      bail_number,
      bail_date,
      category_code,
      lot_number,
      stock_amount,
    } = req.body;

    // Validate required fields
    if (
      !inventoryId ||
      !bail_number ||
      !bail_date ||
      !category_code ||
      !lot_number ||
      !stock_amount
    ) {
      return res.status(400).json({
        message:
          "All fields are required: inventoryId, bail_number, bail_date, category_code, lot_number, stock_amount",
      });
    }

    // Check if inventory exists
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // Create new inventory product
    const newProduct = new InventoryProduct({
      bail_number,
      bail_date: new Date(bail_date),
      category_code,
      lot_number,
      stock_amount: Number(stock_amount),
    });

    // Save the product
    await newProduct.save();

    // Add product to inventory's products array
    inventory.products.push(newProduct._id);
    await inventory.save();

    res.status(201).json({
      message: "Product added to inventory successfully",
      product: newProduct,
    });
  } catch (err) {
    console.error("Error adding product to inventory:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all products in an inventory
const getInventoryProducts = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    // Check if inventory exists
    const inventory = await Inventory.findById(inventoryId).populate({
      path: "products",
      options: { sort: { createdAt: -1 } },
    });
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res.json(inventory.products);
  } catch (err) {
    console.error("Error fetching inventory products:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get a specific product by ID
const getInventoryProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await InventoryProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update a product
const updateInventoryProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;

    console.log("Update data:", req.body);

    console.log(updateData);

    // Find and update the product
    const updatedProduct = await InventoryProduct.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a product
const deleteInventoryProduct = async (req, res) => {
  try {
    const { productId, inventoryId } = req.params;

    // Check if inventory exists
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // Check if product exists
    const product = await InventoryProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove product from inventory's products array
    inventory.products = inventory.products.filter(
      (id) => id.toString() !== productId
    );
    await inventory.save();

    // Delete the product
    // await InventoryProduct.findByIdAndDelete(productId);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createInventoryProduct,
  getInventoryProducts,
  getInventoryProductById,
  updateInventoryProduct,
  deleteInventoryProduct,
  getInventoryName,
};
