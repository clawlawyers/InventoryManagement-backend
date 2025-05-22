const Order = require("../models/Order");
const Client = require("../models/Client");
const Manager = require("../models/Manager");
const Salesman = require("../models/Salesman");
const mongoose = require("mongoose");

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { productName, category, quantity, clientId } = req.body;

    // // Get user information from the authentication middleware
    // const { user, type } = req.user || {
    //   user: { _id: new mongoose.Types.ObjectId(), name: "Test User" },
    //   type: "manager",
    // };

    const { user, type } = req.user;

    // Validate required fields
    if (!productName || !category || !quantity || !clientId) {
      return res.status(400).json({
        message: "Product name, category, quantity, and client ID are required",
      });
    }

    // Validate quantity is a positive number
    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be a positive number",
      });
    }

    // Check if user is authorized (manager or salesman)
    if (type !== "manager" && type !== "salesman") {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can create orders",
      });
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // For salesmen, verify they can create orders for this client
    if (type === "salesman") {
      // Check if the client is assigned to this salesman
      if (
        client.salesman &&
        client.salesman.toString() !== user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "Forbidden: You can only create orders for your assigned clients",
        });
      }
    }

    // Create the order
    const newOrder = new Order({
      productName,
      category,
      quantity,
      client: clientId,
      createdBy: user._id,
      creatorType: type === "manager" ? "Manager" : "Salesman",
    });

    await newOrder.save();

    // Populate the order with client and creator details for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("client", "name phone firmName address")
      .populate("createdBy", "name email phone");

    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all orders (for future use)
const getAllOrders = async (req, res) => {
  try {
    const { user, type } = req.user;

    let orders;
    if (type === "manager") {
      // Managers can see all orders
      orders = await Order.find()
        .populate("client", "name phone firmName address")
        .populate("createdBy", "name email phone")
        .sort({ createdAt: -1 });
    } else if (type === "salesman") {
      // Salesmen can only see orders they created
      orders = await Order.find({ createdBy: user._id })
        .populate("client", "name phone firmName address")
        .populate("createdBy", "name email phone")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can view orders",
      });
    }

    res.json({
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get order by ID (for future use)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type } = req.user;

    const order = await Order.findById(id)
      .populate("client", "name phone firmName address")
      .populate("createdBy", "name email phone");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (
      type === "salesman" &&
      order.createdBy._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: You can only view orders you created",
      });
    }

    res.json({
      message: "Order retrieved successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
};
