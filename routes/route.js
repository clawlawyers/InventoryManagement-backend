const express = require("express");
const router = express.Router();

// Import route modules
const managerRoutes = require("./managerRoutes");
const companyRoutes = require("./companyRoutes");

// Mount routes
router.use("/managers", managerRoutes);
router.use("/companies", companyRoutes);

module.exports = router;
