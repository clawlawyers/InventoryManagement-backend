const express = require("express");
const router = express.Router();

// Import route modules
const managerRoutes = require("./managerRoutes");
const companyRoutes = require("./companyRoutes");
const salesmanRoutes = require("./salesmanRoutes");
const clientRoutes = require("./clientRoutes");
const authRoutes = require("./authRoutes");
const inventoryRoutes = require("./inventoryRoutes");
const invoiceRoutes = require("./invoiceRoutes");
const uploadRoute = require("./uploadRoute");
const orderRoutes = require("./orderRoutes");
const cartRoutes = require("./cartRoutes");
const paymentRoutes = require("./paymentRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/managers", managerRoutes);
router.use("/companies", companyRoutes);
router.use("/salesmen", salesmanRoutes);
router.use("/clients", clientRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/upload", uploadRoute);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/payments", paymentRoutes);

module.exports = router;
