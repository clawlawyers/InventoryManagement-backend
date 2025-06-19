const express = require("express");
const router = express.Router();

// Import route modules
const managerRoutes = require("./managerRoutes");
const companyRoutes = require("./companyRoutes");
const salesmanRoutes = require("./salesmanRoutes");
const clientRoutes = require("./clientRoutes");
const authRoutes = require("./authRoutes");
const inventoryRoutes = require("./inventoryRoutes");
const uploadRoute = require("./uploadRoute");
const orderRoutes = require("./orderRoutes");
const customOrderRoutes = require("./customOrderRoutes"); // Import custom order routes
const cartRoutes = require("./cartRoutes");
const paymentRoutes = require("./paymentRoutes");
const imageGenerationRoutes = require("./imageGeneration");
const whatsappRoutes = require("./whatsappRoutes");
const salesAnalyticsRoutes = require("./salesAnalyticsRoutes");
const walletTopUpRoutes = require("./walletTopUpRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/managers", managerRoutes);
router.use("/companies", companyRoutes);
router.use("/salesmen", salesmanRoutes);
router.use("/clients", clientRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/upload", uploadRoute);
router.use("/orders", orderRoutes);
router.use("/custom-orders", customOrderRoutes); // Use custom order routes
router.use("/cart", cartRoutes);
router.use("/payments", paymentRoutes);
router.use("/genImg", imageGenerationRoutes);
router.use("/whatsapp", whatsappRoutes);
router.use("/analytics", salesAnalyticsRoutes);
router.use("/wallet-topup", walletTopUpRoutes);

module.exports = router;
