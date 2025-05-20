const express = require("express");
const router = express.Router();

// Import route modules
const managerRoutes = require("./managerRoutes");
const companyRoutes = require("./companyRoutes");
const salesmanRoutes = require("./salesmanRoutes");
const clientRoutes = require("./clientRoutes");
const authRoutes = require("./authRoutes");
const inventoryRoutes = require("./inventoryRoutes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/managers", managerRoutes);
router.use("/companies", companyRoutes);
router.use("/salesmen", salesmanRoutes);
router.use("/clients", clientRoutes);
router.use("/inventory", inventoryRoutes);

module.exports = router;
