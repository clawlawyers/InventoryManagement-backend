const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
} = require("../controllers/orderController");
const { requireAuth } = require("../middleware/requireAuth");

// Order routes
router.post("/test/create", createOrder);
router.post("/create", requireAuth, createOrder);
router.get("/", requireAuth, getAllOrders);
router.get("/:id", requireAuth, getOrderById);

module.exports = router;
