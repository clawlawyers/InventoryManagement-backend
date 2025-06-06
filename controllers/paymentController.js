const Payment = require("../models/Payment");
const Order = require("../models/Order");
const mongoose = require("mongoose");

// Create a new payment for an order
const createPayment = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      paymentMethod,
      paymentReference,
      paymentDate,
      notes,
    } = req.body;

    // Get user information from the authentication middleware
    // For testing without auth, provide default values
    const { user, type } = req.user || {
      user: { _id: new mongoose.Types.ObjectId(), name: "Test User" },
      type: "manager",
    };

    // Validate required fields
    if (!orderId || !amount) {
      return res.status(400).json({
        message: "Order ID and amount are required",
      });
    }

    // Validate amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be positive",
      });
    }

    // Check if user is authorized (manager or salesman)
    if (type !== "manager" && type !== "salesman") {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can record payments",
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId).populate("client");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // For salesmen, verify they can record payments for this order
    if (type === "salesman") {
      // Check if the order was created by this salesman or if the client is assigned to them
      const isOrderCreator = order.createdBy.toString() === user._id.toString();
      const isClientAssigned =
        order.client.salesman &&
        order.client.salesman.toString() === user._id.toString();

      if (!isOrderCreator && !isClientAssigned) {
        return res.status(403).json({
          message:
            "Forbidden: You can only record payments for your orders or clients",
        });
      }
    }

    // Check if payment amount doesn't exceed due amount
    if (amount > order.dueAmount) {
      return res.status(400).json({
        message: `Payment amount (${amount}) cannot exceed due amount (${order.dueAmount})`,
      });
    }

    // Create the payment
    const newPayment = new Payment({
      order: orderId,
      client: order.client._id,
      amount,
      paymentMethod: paymentMethod || "cash",
      paymentReference,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      receivedBy: user._id,
      receivedByType: type === "manager" ? "Manager" : "SalesmanTextile",
    });

    await newPayment.save();

    // Update order payment information
    order.paidAmount += amount;
    order.payments.push(newPayment._id);

    // Check if the order is fully paid and update status to completed
    if (order.paidAmount >= order.totalAmount) {
      order.status = "completed";
    }

    await order.save(); // This will trigger the pre-save hook to update payment status

    // Populate the payment with related information for response
    const populatedPayment = await Payment.findById(newPayment._id)
      .populate(
        "order",
        "totalAmount paidAmount dueAmount paymentStatus status"
      )
      .populate("client", "name phone firmName")
      .populate("receivedBy", "name email phone");

    res.status(201).json({
      message: "Payment recorded successfully",
      payment: populatedPayment,
      orderPaymentStatus: {
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        dueAmount: order.dueAmount,
        paymentStatus: order.paymentStatus,
        status: order.status,
      },
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all payments for an order
const getPaymentsByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { user, type } = req.user;

    // Check if order exists
    const order = await Order.findById(orderId).populate("client");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // For salesmen, verify they can view payments for this order
    if (type === "salesman") {
      const isOrderCreator = order.createdBy.toString() === user._id.toString();
      const isClientAssigned =
        order.client.salesman &&
        order.client.salesman.toString() === user._id.toString();

      if (!isOrderCreator && !isClientAssigned) {
        return res.status(403).json({
          message:
            "Forbidden: You can only view payments for your orders or clients",
        });
      }
    }

    const payments = await Payment.find({ order: orderId })
      .populate("client", "name phone firmName")
      .populate("receivedBy", "name email phone")
      .sort({ paymentDate: -1 });

    res.json({
      message: "Payments retrieved successfully",
      payments,
      orderSummary: {
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount,
        dueAmount: order.dueAmount,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all payments (for managers) or payments received by salesman
const getAllPayments = async (req, res) => {
  try {
    const { user, type } = req.user;

    let payments;
    if (type === "manager") {
      // Managers can see all payments
      payments = await Payment.find()
        .populate("order", "totalAmount paidAmount dueAmount paymentStatus")
        .populate("client", "name phone firmName")
        .populate("receivedBy", "name email phone")
        .sort({ paymentDate: -1 });
    } else if (type === "salesman") {
      // Salesmen can only see payments they received
      payments = await Payment.find({ receivedBy: user._id })
        .populate("order", "totalAmount paidAmount dueAmount paymentStatus")
        .populate("client", "name phone firmName")
        .populate("receivedBy", "name email phone")
        .sort({ paymentDate: -1 });
    } else {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can view payments",
      });
    }

    res.json({
      message: "Payments retrieved successfully",
      payments,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type } = req.user;

    const payment = await Payment.findById(id)
      .populate("order", "totalAmount paidAmount dueAmount paymentStatus")
      .populate("client", "name phone firmName address")
      .populate("receivedBy", "name email phone");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Check authorization
    if (
      type === "salesman" &&
      payment.receivedBy._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: You can only view payments you received",
      });
    }

    res.json({
      message: "Payment retrieved successfully",
      payment,
    });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createPayment,
  getPaymentsByOrder,
  getAllPayments,
  getPaymentById,
};
