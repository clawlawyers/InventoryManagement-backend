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
      gstPercentage = 0,
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
      !billingTo.firmGstNumber ||
      !billingTo.mobileNumber
    ) {
      return res.status(400).json({
        message:
          "Missing required firm details or mobile number in billingFrom or billingTo.",
      });
    }

    if (typeof billingTo.mobileNumber !== "number") {
      return res.status(400).json({
        message: "Mobile number in billingTo must be a number.",
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
    // Calculate final total with discount
    let amountAfterDiscount = subTotal;
    if (discountPercentage > 0) {
      amountAfterDiscount -= subTotal * (discountPercentage / 100);
    }
    if (discountAmount > 0) {
      amountAfterDiscount -= discountAmount;
    }
    amountAfterDiscount = Math.max(0, amountAfterDiscount); // Ensure amount doesn't go below zero

    let finalTotalAmount = amountAfterDiscount;
    if (gstPercentage > 0) {
      finalTotalAmount += amountAfterDiscount * (gstPercentage / 100);
    }

    const newCustomOrder = new CustomOrder({
      billingFrom,
      billingTo,
      billingDetails,
      items: processedItems,
      totalAmount: finalTotalAmount,
      dueAmount: finalTotalAmount,
      discountPercentage,
      discountAmount,
      gstPercentage,
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
    doc.text(`Mobile Number: ${order.billingTo.mobileNumber}`);
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
    if (order.gstPercentage > 0) {
      doc.text(`GST Percentage: ${order.gstPercentage}%`);
      // Recalculate GST amount for display in PDF if needed, or rely on stored totalAmount
      const amountBeforeGST =
        subTotal -
        (subTotal * (order.discountPercentage || 0)) / 100 -
        (order.discountAmount || 0);
      const gstAmountForDisplay = amountBeforeGST * (order.gstPercentage / 100);
      doc.text(`GST Amount: ₹${gstAmountForDisplay.toFixed(2)}`);
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

const updateCustomOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid custom order ID." });
    }

    const customOrder = await CustomOrder.findById(orderId);
    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found." });
    }

    // Update fields
    for (const key in updates) {
      if (key === "items" && Array.isArray(updates.items)) {
        // Handle items update with validation and recalculation
        let subTotal = 0;
        const processedItems = [];
        for (let i = 0; i < updates.items.length; i++) {
          const item = updates.items[i];
          if (!item.itemName || !item.quantity || !item.rate) {
            return res.status(400).json({
              message: `Item ${
                i + 1
              }: itemName, quantity, and rate are required.`,
            });
          }
          if (item.quantity <= 0 || item.rate < 0) {
            return res.status(400).json({
              message: `Item ${
                i + 1
              }: quantity must be positive and rate non-negative.`,
            });
          }
          if (
            item.productId &&
            !mongoose.Types.ObjectId.isValid(item.productId)
          ) {
            return res
              .status(400)
              .json({ message: `Item ${i + 1}: Invalid productId.` });
          }

          processedItems.push({
            itemName: item.itemName,
            quantity: item.quantity,
            rate: item.rate,
            productId: item.productId || undefined,
          });
          subTotal += item.quantity * item.rate;
        }
        customOrder.items = processedItems;
        customOrder.subTotal = subTotal; // Store subTotal for easier recalculation
      } else if (
        key === "billingFrom" ||
        key === "billingTo" ||
        key === "billingDetails"
      ) {
        // Merge nested objects
        if (
          key === "billingTo" &&
          updates[key] &&
          updates[key].mobileNumber !== undefined
        ) {
          if (typeof updates[key].mobileNumber !== "number") {
            return res.status(400).json({
              message: "Mobile number in billingTo must be a number.",
            });
          }
        }
        customOrder[key] = { ...customOrder[key], ...updates[key] };
      } else if (
        key !== "_id" &&
        key !== "createdAt" &&
        key !== "updatedAt" &&
        key !== "payments"
      ) {
        customOrder[key] = updates[key];
      }
    }

    // Recalculate totalAmount and dueAmount if relevant fields changed
    let currentSubTotal = customOrder.items.reduce(
      (sum, item) => sum + item.quantity * item.rate,
      0
    );

    let amountAfterDiscount = currentSubTotal;
    const discountPercentage = customOrder.discountPercentage || 0;
    const discountAmount = customOrder.discountAmount || 0;

    if (discountPercentage > 0) {
      amountAfterDiscount -= currentSubTotal * (discountPercentage / 100);
    }
    if (discountAmount > 0) {
      amountAfterDiscount -= discountAmount;
    }
    amountAfterDiscount = Math.max(0, amountAfterDiscount);

    let newTotalAmount = amountAfterDiscount;
    const gstPercentage = customOrder.gstPercentage || 0;
    if (gstPercentage > 0) {
      newTotalAmount += amountAfterDiscount * (gstPercentage / 100);
    }

    // Adjust dueAmount based on the change in totalAmount
    const totalAmountDifference = newTotalAmount - customOrder.totalAmount;
    customOrder.totalAmount = newTotalAmount;
    customOrder.dueAmount += totalAmountDifference; // Adjust dueAmount by the difference
    customOrder.dueAmount = Math.max(0, customOrder.dueAmount); // Ensure dueAmount is not negative

    // Update status if dueAmount becomes zero
    if (customOrder.dueAmount === 0 && customOrder.status !== "completed") {
      customOrder.status = "completed";
    } else if (
      customOrder.dueAmount > 0 &&
      customOrder.status === "completed"
    ) {
      customOrder.status = "pending"; // If dueAmount becomes positive again
    }

    customOrder.updatedAt = new Date(); // Update timestamp

    await customOrder.save();

    res.status(200).json({
      message: "Custom order updated successfully",
      order: customOrder,
    });
  } catch (error) {
    console.error("Error updating custom order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteCustomOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid custom order ID." });
    }

    const customOrder = await CustomOrder.findByIdAndDelete(orderId);

    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found." });
    }

    res.status(200).json({ message: "Custom order deleted successfully." });
  } catch (error) {
    console.error("Error deleting custom order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const updateCustomOrderPayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.params;
    const { amount, paymentMethod, paymentReference, paymentDate, notes } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid custom order ID." });
    }
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID." });
    }

    const customOrder = await CustomOrder.findById(orderId);
    if (!customOrder) {
      return res.status(404).json({ message: "Custom order not found." });
    }

    const paymentIndex = customOrder.payments.findIndex(
      (p) => p._id.toString() === paymentId
    );
    if (paymentIndex === -1) {
      return res
        .status(404)
        .json({ message: "Payment not found in this order." });
    }

    const oldPaymentAmount = customOrder.payments[paymentIndex].amount;

    // Update payment fields
    if (amount !== undefined)
      customOrder.payments[paymentIndex].amount = amount;
    if (paymentMethod !== undefined)
      customOrder.payments[paymentIndex].paymentMethod = paymentMethod;
    if (paymentReference !== undefined)
      customOrder.payments[paymentIndex].paymentReference = paymentReference;
    if (paymentDate !== undefined)
      customOrder.payments[paymentIndex].paymentDate = new Date(paymentDate);
    if (notes !== undefined) customOrder.payments[paymentIndex].notes = notes;
    customOrder.payments[paymentIndex].updatedAt = new Date();

    // Recalculate paidAmount and dueAmount
    customOrder.paidAmount = customOrder.payments.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    customOrder.dueAmount = customOrder.totalAmount - customOrder.paidAmount;

    // Ensure dueAmount is not negative
    customOrder.dueAmount = Math.max(0, customOrder.dueAmount);

    // Update order status based on dueAmount
    if (customOrder.dueAmount <= 0) {
      customOrder.status = "completed";
      customOrder.dueAmount = 0;
    } else {
      customOrder.status = "pending"; // Or whatever status indicates partial payment
    }

    await customOrder.save();

    res.status(200).json({
      message: "Payment updated successfully for custom order",
      payment: customOrder.payments[paymentIndex],
      customOrderPaymentStatus: {
        totalAmount: customOrder.totalAmount,
        paidAmount: customOrder.paidAmount,
        dueAmount: customOrder.dueAmount,
        status: customOrder.status,
      },
    });
  } catch (error) {
    console.error("Error updating payment for custom order:", error);
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
  updateCustomOrder,
  deleteCustomOrder,
  updateCustomOrderPayment,
};
