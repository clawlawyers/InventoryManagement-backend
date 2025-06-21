const WalletTopUpOrder = require("../models/WalletTopUpOrder");
const Manager = require("../models/Manager");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Define plan details
const PLAN_DETAILS = {
  starter: { price: 1500, coins: 250, validityDays: 30 },
  pro: { price: 3000, coins: 500, validityDays: 30 },
  elite: { price: 6000, coins: 1000, validityDays: 30 },
  custom: { price: null, coins: null, validityDays: 30 }, // Custom plan has flexible amount/coins, default 30 days validity. Price and coins are determined by amount.
  add_credit_only: { price: null, coins: null, validityDays: null }, // Special type for adding credit without changing plan
};

// Function to create a new Wallet Top-Up Order and initiate Razorpay payment
const createWalletTopUpOrder = async (req, res) => {
  try {
    const { managerId, amount, currency, planType } = req.body; // Added planType
    const { user, type } = req.user; // Assuming user is authenticated

    // Validate input
    if (!managerId || !amount || !currency) {
      return res
        .status(400)
        .json({ message: "Manager ID, amount, and currency are required." });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive." });
    }
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ message: "Invalid Manager ID." });
    }

    // Validate planType if provided
    if (planType && !Object.keys(PLAN_DETAILS).includes(planType)) {
      return res.status(400).json({ message: "Invalid plan type provided." });
    }
    // Prevent using 'add_credit_only' directly for plan purchases
    if (planType === "add_credit_only") {
      return res
        .status(400)
        .json({
          message: "'add_credit_only' is not a valid plan for direct purchase.",
        });
    }

    // If a specific plan is chosen, validate amount against plan price
    if (planType && planType !== "custom") {
      const requiredAmount = PLAN_DETAILS[planType].price;
      if (amount !== requiredAmount) {
        return res.status(400).json({
          message: `Amount for ${planType} plan must be ${requiredAmount} ${currency}.`,
        });
      }
    }

    // Ensure the authenticated user is the manager or an admin
    if (type === "manager" && user._id.toString() !== managerId) {
      return res.status(403).json({
        message:
          "Unauthorized: You can only create top-up orders for your own wallet.",
      });
    }
    // Add admin check if needed: if (type !== "admin" && type !== "manager") { ... }

    const manager = await Manager.findById(managerId);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found." });
    }

    // Create a new WalletTopUpOrder in your database
    const newTopUpOrder = new WalletTopUpOrder({
      manager: managerId,
      amount,
      currency,
      paymentStatus: "pending",
      // Store planType in notes for verification step
      notes: { planType: planType || "custom" },
    });
    await newTopUpOrder.save();

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in paise
      currency,
      receipt: `wtup_${newTopUpOrder._id.toString().slice(-15)}`, // Shortened receipt for Razorpay limit (max 40 chars)
      notes: {
        topUpOrderId: newTopUpOrder._id.toString(), // Link to our internal top-up order
        type: "wallet_topup", // Differentiate from regular orders
        planType: planType || "custom", // Pass planType to Razorpay notes
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    await newTopUpOrder.save(); // Save again if any fields were updated after Razorpay order creation (e.g., razorpayOrderId if we re-added it)

    res.status(201).json({
      message: "Wallet top-up order created and Razorpay order initiated.",
      topUpOrder: newTopUpOrder,
      razorpayOrderId: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount / 100, // Amount in rupees
    });
  } catch (error) {
    console.error("Error creating wallet top-up order:", error);
    res.status(500).json({
      message: "Failed to create wallet top-up order.",
      error: error.message,
    });
  }
};

// Function to verify Razorpay payment for Wallet Top-Up Order
const verifyWalletTopUpPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature === razorpaySignature) {
      // Payment is verified
      const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
      const topUpOrderId = razorpayOrder.notes.topUpOrderId;
      const planType = razorpayOrder.notes.planType || "custom"; // Get planType from notes
      const amountPaidInPaise = razorpayOrder.amount;
      const amountPaidInRupees = amountPaidInPaise / 100;

      const topUpOrder = await WalletTopUpOrder.findById(topUpOrderId);

      if (!topUpOrder) {
        return res
          .status(404)
          .json({ message: "Wallet top-up order not found in our system." });
      }

      // Prevent double processing
      if (topUpOrder.paymentStatus === "paid") {
        return res.status(200).json({
          message: "Payment already processed for this top-up order.",
        });
      }

      // Validate paid amount against plan price if applicable
      if (planType !== "custom" && planType !== "add_credit_only") {
        // Exclude add_credit_only from price validation
        const expectedPrice = PLAN_DETAILS[planType].price;
        if (amountPaidInRupees !== expectedPrice) {
          console.warn(
            `Amount mismatch for ${planType} plan. Expected: ${expectedPrice}, Paid: ${amountPaidInRupees}`
          );
          // You might want to handle this as a failed payment or flag it
          return res.status(400).json({
            message: `Amount mismatch for ${planType} plan. Expected ${expectedPrice}, but received ${amountPaidInRupees}.`,
          });
        }
      }

      // Update WalletTopUpOrder status and payment details
      topUpOrder.paymentStatus = "paid";
      await topUpOrder.save();

      // Update manager's wallet balance and plan
      const manager = await Manager.findById(topUpOrder.manager);
      if (manager) {
        let coinsToAdd;
        let newPlanPrice;

        // Determine coins to add and the new plan's price
        if (planType === "custom" || planType === "add_credit_only") {
          // For custom and add_credit_only, coins are based on amount
          coinsToAdd = amountPaidInRupees / 6; // 1 coin = 6 rupee for custom/add_credit_only
          newPlanPrice = amountPaidInRupees; // For custom/add_credit_only, price is the amount paid
        } else {
          coinsToAdd = PLAN_DETAILS[planType].coins; // Fixed coins for plans
          newPlanPrice = PLAN_DETAILS[planType].price; // For fixed plans, price is from PLAN_DETAILS
        }

        // Apply plan upgrade logic (for all plans including custom)
        const currentPlan = manager.wallet.plan;
        let effectiveCurrentPlanPrice = 0;

        if (currentPlan === "custom") {
          // If current plan is custom, use its stored planPrice for comparison
          effectiveCurrentPlanPrice = manager.wallet.planPrice || 0;
        } else if (PLAN_DETAILS[currentPlan]) {
          // For other defined plans, use their price from PLAN_DETAILS
          effectiveCurrentPlanPrice = PLAN_DETAILS[currentPlan].price;
        }
        // If currentPlan is 'default' or undefined, effectiveCurrentPlanPrice remains 0

        // Only update plan details if it's not an "add_credit_only" transaction
        if (planType !== "add_credit_only") {
          // Check if the new plan is lower in price
          if (newPlanPrice < effectiveCurrentPlanPrice) {
            return res.status(400).json({
              message: `Cannot upgrade to a lower priced plan. Current plan: ${currentPlan} (Price: ${effectiveCurrentPlanPrice}), New plan: ${planType} (Price: ${newPlanPrice}).`,
            });
          }
          manager.wallet.plan = planType; // Update manager's plan
          manager.wallet.planStartDate = new Date(); // Set new plan start date
          manager.wallet.planPrice = newPlanPrice; // Store the price of the new plan

          // Calculate expiry date
          const validityDays = PLAN_DETAILS[planType].validityDays;
          if (validityDays) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + validityDays);
            manager.wallet.expiryDate = expiryDate;
          } else if (planType === "custom") {
            // Ensure custom plan also gets an expiry date if validityDays is not explicitly set in PLAN_DETAILS
            const defaultCustomValidityDays = 30; // Or derive from amountPaidInRupees if needed
            const expiryDate = new Date();
            expiryDate.setDate(
              expiryDate.getDate() + defaultCustomValidityDays
            );
            manager.wallet.expiryDate = expiryDate;
          }
        }

        manager.wallet.coins += coinsToAdd; // Always add coins
        await manager.save();
      } else {
        console.warn(
          `Manager ${topUpOrder.manager} not found for top-up order ${topUpOrderId}. Wallet not updated.`
        );
      }

      res.status(200).json({
        message: "Wallet top-up payment verified and processed successfully.",
        topUpOrder,
        managerWallet: manager ? manager.wallet : null,
      });
    } else {
      // Signature mismatch
      res
        .status(400)
        .json({ message: "Payment verification failed: Signature mismatch." });
    }
  } catch (error) {
    console.error("Error verifying wallet top-up payment:", error);
    res.status(500).json({
      message: "Failed to verify wallet top-up payment.",
      error: error.message,
    });
  }
};

// Function to add credit to a manager's wallet and initiate Razorpay payment
const addCreditToWallet = async (req, res) => {
  try {
    const { managerId, amount, currency } = req.body; // planType is implicitly "add_credit_only"
    const { user, type } = req.user; // Assuming user is authenticated

    // Validate input
    if (!managerId || !amount || !currency) {
      return res
        .status(400)
        .json({ message: "Manager ID, amount, and currency are required." });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be positive." });
    }
    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ message: "Invalid Manager ID." });
    }

    // Ensure the authenticated user is the manager or an admin
    if (type === "manager" && user._id.toString() !== managerId) {
      return res.status(403).json({
        message: "Unauthorized: You can only add credit to your own wallet.",
      });
    } else if (type !== "admin" && type !== "manager") {
      return res.status(403).json({
        message:
          "Unauthorized: Only administrators or the manager themselves can add credit.",
      });
    }

    const manager = await Manager.findById(managerId);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found." });
    }

    // Create a new WalletTopUpOrder in your database
    const newTopUpOrder = new WalletTopUpOrder({
      manager: managerId,
      amount,
      currency,
      paymentStatus: "pending",
      notes: { planType: "add_credit_only" }, // Explicitly set planType for this type of transaction
    });
    await newTopUpOrder.save();

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in paise
      currency,
      receipt: `wtup_${newTopUpOrder._id.toString().slice(-15)}`,
      notes: {
        topUpOrderId: newTopUpOrder._id.toString(),
        type: "wallet_topup",
        planType: "add_credit_only", // Pass this to Razorpay notes
      },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(201).json({
      message: "Wallet credit order created and Razorpay payment initiated.",
      topUpOrder: newTopUpOrder,
      razorpayOrderId: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount / 100,
    });
  } catch (error) {
    console.error("Error initiating wallet credit payment:", error);
    res.status(500).json({
      message: "Failed to initiate wallet credit payment.",
      error: error.message,
    });
  }
};

/*
// Webhook to handle Razorpay payment status updates
const handleRazorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET; // Define a webhook secret in your .env

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest === req.headers["x-razorpay-signature"]) {
    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`Received Razorpay webhook event: ${event}`);

    try {
      switch (event) {
        case "payment.captured":
          // Payment was successful
          const payment = payload.payment.entity;
          const razorpayOrderId = payment.order_id;
          const razorpayPaymentId = payment.id;
          const amountPaidInPaise = payment.amount;
          const amountPaidInRupees = amountPaidInPaise / 100;
          const planType = payment.notes.planType || "custom";
          const topUpOrderId = payment.notes.topUpOrderId;

          const topUpOrder = await WalletTopUpOrder.findById(topUpOrderId);

          if (!topUpOrder) {
            console.error(
              `Webhook: Wallet top-up order ${topUpOrderId} not found.`
            );
            return res
              .status(404)
              .json({ message: "Wallet top-up order not found." });
          }

          if (topUpOrder.paymentStatus === "paid") {
            console.log(
              `Webhook: Payment for order ${topUpOrderId} already processed.`
            );
            return res
              .status(200)
              .json({ message: "Payment already processed." });
          }

          // Validate paid amount against plan price if applicable
          if (planType !== "custom" && planType !== "add_credit_only") {
            const expectedPrice = PLAN_DETAILS[planType].price;
            if (amountPaidInRupees !== expectedPrice) {
              console.warn(
                `Webhook: Amount mismatch for ${planType} plan. Expected: ${expectedPrice}, Paid: ${amountPaidInRupees}`
              );
              // You might want to handle this as a failed payment or flag it
              topUpOrder.paymentStatus = "failed"; // Mark as failed due to amount mismatch
              topUpOrder.notes.webhookError = `Amount mismatch. Expected ${expectedPrice}, received ${amountPaidInRupees}.`;
              await topUpOrder.save();
              return res.status(400).json({
                message: `Amount mismatch for ${planType} plan. Expected ${expectedPrice}, but received ${amountPaidInRupees}.`,
              });
            }
          }

          topUpOrder.paymentStatus = "paid";
          topUpOrder.razorpayPaymentId = razorpayPaymentId;
          topUpOrder.razorpayOrderId = razorpayOrderId;
          await topUpOrder.save();

          const manager = await Manager.findById(topUpOrder.manager);
          if (manager) {
            let coinsToAdd;
            let newPlanPrice;

            if (planType === "custom" || planType === "add_credit_only") {
              coinsToAdd = amountPaidInPaise / 6;
              newPlanPrice = amountPaidInPaise / 100;
            } else {
              coinsToAdd = PLAN_DETAILS[planType].coins;
              newPlanPrice = PLAN_DETAILS[planType].price;
            }

            const currentPlan = manager.wallet.plan;
            let effectiveCurrentPlanPrice = 0;

            if (currentPlan === "custom") {
              effectiveCurrentPlanPrice = manager.wallet.planPrice || 0;
            } else if (PLAN_DETAILS[currentPlan]) {
              effectiveCurrentPlanPrice = PLAN_DETAILS[currentPlan].price;
            }

            if (planType !== "add_credit_only") {
              if (newPlanPrice < effectiveCurrentPlanPrice) {
                console.warn(
                  `Webhook: Cannot upgrade to a lower priced plan for manager ${manager._id}. Current: ${currentPlan} (${effectiveCurrentPlanPrice}), New: ${planType} (${newPlanPrice}).`
                );
                return res.status(400).json({
                  message: `Cannot upgrade to a lower priced plan. Current plan: ${currentPlan} (Price: ${effectiveCurrentPlanPrice}), New plan: ${planType} (Price: ${newPlanPrice}).`,
                });
              }
              manager.wallet.plan = planType;
              manager.wallet.planStartDate = new Date();
              manager.wallet.planPrice = newPlanPrice;

              const validityDays = PLAN_DETAILS[planType].validityDays;
              if (validityDays) {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + validityDays);
                manager.wallet.expiryDate = expiryDate;
              } else if (planType === "custom") {
                const defaultCustomValidityDays = 30;
                const expiryDate = new Date();
                expiryDate.setDate(
                  expiryDate.getDate() + defaultCustomValidityDays
                );
                manager.wallet.expiryDate = expiryDate;
              }
            }
            manager.wallet.coins += coinsToAdd;
            await manager.save();
            console.log(
              `Webhook: Manager ${manager._id} wallet updated successfully.`
            );
          } else {
            console.warn(
              `Webhook: Manager ${topUpOrder.manager} not found for top-up order ${topUpOrderId}. Wallet not updated.`
            );
          }
          break;

        case "payment.failed":
          const failedPayment = payload.payment.entity;
          const failedTopUpOrderId = failedPayment.notes.topUpOrderId;

          const failedTopUpOrder = await WalletTopUpOrder.findById(
            failedTopUpOrderId
          );
          if (failedTopUpOrder && failedTopUpOrder.paymentStatus !== "paid") {
            failedTopUpOrder.paymentStatus = "failed";
            failedTopUpOrder.razorpayPaymentId = failedPayment.id;
            failedTopUpOrder.razorpayOrderId = failedPayment.order_id;
            failedTopUpOrder.notes.failureReason =
              failedPayment.error_description || "Payment failed";
            await failedTopUpOrder.save();
            console.log(
              `Webhook: Payment for order ${failedTopUpOrderId} marked as failed.`
            );
          }
          break;

        // Add other event types as needed (e.g., refund, disputed)
        default:
          console.log(`Webhook: Unhandled event type: ${event}`);
          break;
      }
      res.status(200).json({ status: "ok" });
    } catch (error) {
      console.error("Error processing Razorpay webhook:", error);
      res
        .status(500)
        .json({ message: "Failed to process webhook.", error: error.message });
    }
  } else {
    console.warn("Razorpay webhook signature mismatch.");
    res.status(403).json({ message: "Invalid signature." });
  }
};
*/

module.exports = {
  createWalletTopUpOrder,
  verifyWalletTopUpPayment,
  addCreditToWallet,
  // handleRazorpayWebhook, // Commented out for now
};
