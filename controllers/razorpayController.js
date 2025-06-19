const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
const Order = require("../models/Order");
const Manager = require("../models/Manager");
const Payment = require("../models/Payment");
const mongoose = require("mongoose");

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const createRazorpayOrder = async (req, res) => {
  const { amount, currency, orderId } = req.body; // Include orderId to link payment to an existing order
  const options = {
    amount: amount * 100, // amount in paise
    currency,
    receipt: `order_${orderId}_${Date.now()}`, // Link receipt to orderId
    notes: {
      orderId: orderId, // Store orderId in notes for verification
    },
  };
  try {
    const order = await razorpay.orders.create(options);
    res.json({ success: true, orderId: order.id, razorpayOrderId: order.id });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Razorpay order creation failed",
        error: error.message,
      });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (generatedSignature === razorpaySignature) {
    try {
      // Fetch the Razorpay order details to get the original amount and notes (including our orderId)
      const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
      const orderId = razorpayOrder.notes.orderId;
      const amountPaidInPaise = razorpayOrder.amount; // Amount in paise
      const amountPaidInRupees = amountPaidInPaise / 100; // Convert to rupees

      // Find the corresponding Order
      const order = await Order.findById(orderId)
        .populate("client")
        .populate("company");
      if (!order) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found in our system" });
      }

      // Prevent double processing of the same payment
      const existingPayment = await Payment.findOne({
        paymentReference: razorpayPaymentId,
      });
      if (existingPayment) {
        return res
          .status(200)
          .json({ success: true, message: "Payment already processed" });
      }

      // Update order payment information
      order.paidAmount += amountPaidInRupees;
      // The pre-save hook on OrderSchema will handle paymentStatus and dueAmount
      await order.save();

      // Update manager's wallet balance
      let manager;
      if (order.creatorType === "Manager") {
        manager = await Manager.findById(order.createdBy);
      } else if (order.creatorType === "SalesmanTextile" && order.company) {
        // If created by salesman, find the manager associated with the company
        manager = await Manager.findOne({ companies: order.company._id });
      }

      if (manager) {
        const coinsToAdd = amountPaidInRupees / 6; // 1 coin = 6 rupee
        manager.wallet.coins += coinsToAdd;
        await manager.save();
      } else {
        console.warn(
          `Manager not found for order ${orderId}. Wallet not updated.`
        );
      }

      // Create a new Payment record
      const newPayment = new Payment({
        order: orderId,
        client: order.client._id,
        amount: amountPaidInRupees,
        paymentMethod: "Razorpay",
        paymentReference: razorpayPaymentId,
        paymentDate: new Date(),
        notes: `Razorpay Order ID: ${razorpayOrderId}`,
        receivedBy: manager ? manager._id : null, // Assign to manager if found
        receivedByType: manager ? "Manager" : undefined, // Set type if manager found
      });

      await newPayment.save();

      // Link the new payment to the order's payments array
      order.payments.push(newPayment._id);
      await order.save(); // Save again to update the payments array

      res.json({
        success: true,
        message: "Payment verified and processed successfully",
        order,
        managerWallet: manager ? manager.wallet : null,
      });
    } catch (error) {
      console.error("Payment verification or processing failed:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Payment verification or processing failed",
          error: error.message,
        });
    }
  } else {
    res
      .status(400)
      .json({
        success: false,
        message: "Payment verification failed: Signature mismatch",
      });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};
