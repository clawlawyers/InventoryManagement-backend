const CustomOrder = require("../models/CustomOrder");
const InventoryProduct = require("../models/InventoryProduct");
const mongoose = require("mongoose");

const createCustomOrder = async (req, res) => {
  try {
    const {
      billingFrom,
      billingTo,
      billingDetails,
      items,
      discountPercentage = 0,
      discountAmount = 0,
    } = req.body;

    // Basic validation
    if (
      !billingFrom ||
      !billingTo ||
      !billingDetails ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Missing required billing, items, or item details." });
    }

    if (
      !billingFrom.firmName ||
      !billingFrom.firmAddress ||
      !billingFrom.firmGstNumber ||
      !billingTo.firmName ||
      !billingTo.firmAddress ||
      !billingTo.firmGstNumber
    ) {
      return res.status(400).json({
        message: "Missing required firm details in billingFrom or billingTo.",
      });
    }

    if (!billingDetails.billingDate || !billingDetails.billingDueDate) {
      return res
        .status(400)
        .json({ message: "Missing required billing dates." });
    }

    let subTotal = 0;
    let processedItems = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.itemName || !item.quantity || !item.rate) {
        return res.status(400).json({
          message: `Item ${i + 1}: itemName, quantity, and rate are required.`,
        });
      }
      if (item.quantity <= 0 || item.rate < 0) {
        return res.status(400).json({
          message: `Item ${
            i + 1
          }: quantity must be positive and rate non-negative.`,
        });
      }

      let itemTotalPrice = item.quantity * item.rate;

      // If productId is provided, validate it against InventoryProduct
      if (item.productId) {
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
          return res
            .status(400)
            .json({ message: `Item ${i + 1}: Invalid productId.` });
        }
        const inventoryProduct = await InventoryProduct.findById(
          item.productId
        );
        if (!inventoryProduct) {
          return res
            .status(404)
            .json({ message: `Item ${i + 1}: Inventory product not found.` });
        }
        // Optionally, you could use inventoryProduct.price if item.rate is not provided
        // For now, we'll stick to item.rate as per schema
      }

      processedItems.push({
        itemName: item.itemName,
        quantity: item.quantity,
        rate: item.rate,
        productId: item.productId || undefined, // Store productId if provided
      });
      subTotal += itemTotalPrice;
    }

    // Calculate final total with discount
    let finalTotalAmount = subTotal;
    if (discountPercentage > 0) {
      finalTotalAmount -= subTotal * (discountPercentage / 100);
    }
    if (discountAmount > 0) {
      finalTotalAmount -= discountAmount;
    }
    finalTotalAmount = Math.max(0, finalTotalAmount); // Ensure total doesn't go below zero

    const newCustomOrder = new CustomOrder({
      billingFrom,
      billingTo,
      billingDetails,
      items: processedItems,
      totalAmount: finalTotalAmount,
      dueAmount: finalTotalAmount,
      discountPercentage,
      discountAmount,
    });

    await newCustomOrder.save();

    res.status(201).json({
      message: "Custom order created successfully",
      order: newCustomOrder,
      dueAmount: newCustomOrder.dueAmount,
    });
  } catch (error) {
    console.error("Error creating custom order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const PDFDocument = require("pdfkit");

// Get all custom orders
const getAllCustomOrders = async (req, res) => {
  try {
    const orders = await CustomOrder.find().sort({ createdAt: -1 });
    res.json({
      message: "Custom orders retrieved successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Generate invoice PDF for a custom order
const generateCustomOrderInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await CustomOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    // Create PDF in memory
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="custom_order_invoice_${order._id}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.send(pdfBuffer);
    });

    // Header
    doc.fontSize(20).text("CUSTOM ORDER INVOICE", { align: "center" });
    doc.moveDown(2);

    // Billing From
    doc.fontSize(14).text("Billing From:", { underline: true });
    doc.fontSize(12);
    doc.text(`Firm Name: ${order.billingFrom.firmName}`);
    doc.text(`Address: ${order.billingFrom.firmAddress}`);
    doc.text(`GST Number: ${order.billingFrom.firmGstNumber}`);
    doc.moveDown();

    // Billing To
    doc.fontSize(14).text("Billing To:", { underline: true });
    doc.fontSize(12);
    doc.text(`Firm Name: ${order.billingTo.firmName}`);
    doc.text(`Address: ${order.billingTo.firmAddress}`);
    doc.text(`GST Number: ${order.billingTo.firmGstNumber}`);
    doc.moveDown();

    // Billing Details
    doc.fontSize(14).text("Billing Details:", { underline: true });
    doc.fontSize(12);
    doc.text(
      `Billing Date: ${new Date(
        order.billingDetails.billingDate
      ).toLocaleDateString()}`
    );
    doc.text(
      `Due Date: ${new Date(
        order.billingDetails.billingDueDate
      ).toLocaleDateString()}`
    );
    doc.moveDown();

    // Items Table Header
    doc.fontSize(14).text("Items:", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text("Item Name           Quantity           Rate           Total", {
      continued: false,
    });
    doc.moveDown(0.5);

    // Items Table Rows
    let subTotal = 0;
    order.items.forEach((item) => {
      const total = item.quantity * item.rate;
      subTotal += total;
      doc.text(
        `${item.itemName.padEnd(20)}${item.quantity
          .toString()
          .padEnd(18)}${item.rate.toFixed(2).padEnd(15)}${total.toFixed(2)}`,
        { continued: false }
      );
    });
    doc.moveDown();

    // Discount and Total
    doc.fontSize(12);
    doc.text(`Subtotal: ₹${subTotal.toFixed(2)}`);
    if (order.discountPercentage > 0) {
      doc.text(`Discount Percentage: ${order.discountPercentage}%`);
    }
    if (order.discountAmount > 0) {
      doc.text(`Discount Amount: ₹${order.discountAmount.toFixed(2)}`);
    }
    doc
      .fontSize(14)
      .text(
        `Total Amount: ₹${
          order.totalAmount ? order.totalAmount.toFixed(2) : subTotal.toFixed(2)
        }`,
        { underline: true }
      );

    doc.end();
  } catch (error) {
    console.error("Error generating custom order invoice:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Create a new payment for a custom order (embedded)
const createCustomOrderPayment = async (req, res) => {
  try {
    const {
      orderId,
      amount,
      paymentMethod,
      paymentReference,
      paymentDate,
      notes,
    } = req.body;

    const { user, type } = req.user || {
      user: { _id: new mongoose.Types.ObjectId(), name: "Test User" },
      type: "manager",
    };

    if (!orderId || !amount) {
      return res.status(400).json({
        message: "Custom order ID and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be positive",
      });
    }

    if (type !== "manager" && type !== "salesman") {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can record payments",
      });
    }

    const customOrder = await CustomOrder.findById(orderId);
    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found" });
    }

    // Initialize paidAmount and dueAmount if they don't exist
    if (typeof customOrder.paidAmount !== "number") customOrder.paidAmount = 0;
    if (typeof customOrder.dueAmount !== "number")
      customOrder.dueAmount = customOrder.totalAmount || 0;

    if (amount > customOrder.dueAmount) {
      return res.status(400).json({
        message: `Payment amount (${amount}) cannot exceed due amount (${customOrder.dueAmount})`,
      });
    }

    const newPayment = {
      amount,
      paymentMethod: paymentMethod || "cash",
      paymentReference,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      receivedBy: user._id,
      receivedByType: type === "manager" ? "Manager" : "SalesmanTextile",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    customOrder.payments.push(newPayment);
    customOrder.paidAmount += amount;
    customOrder.dueAmount -= amount;

    if (customOrder.dueAmount <= 0) {
      customOrder.status = "completed";
      customOrder.dueAmount = 0; // Ensure dueAmount is not negative
    } else {
      customOrder.status = "pending"; // Or whatever status indicates partial payment
    }

    await customOrder.save();

    res.status(201).json({
      message: "Payment recorded successfully for custom order",
      payment: newPayment, // Return the embedded payment object
      customOrderPaymentStatus: {
        totalAmount: customOrder.totalAmount,
        paidAmount: customOrder.paidAmount,
        dueAmount: customOrder.dueAmount,
        status: customOrder.status,
      },
    });
  } catch (error) {
    console.error("Error creating payment for custom order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createCustomOrder,
  getAllCustomOrders,
  generateCustomOrderInvoice,
  createCustomOrderPayment,
};
