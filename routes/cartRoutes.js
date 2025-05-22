const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkoutCart,
} = require("../controllers/cartController");
const { requireAuth } = require("../middleware/requireAuth");

// Cart routes - all require authentication
router.get("/", requireAuth, getCart); // Get user's cart
router.post("/add", requireAuth, addToCart); // Add item to cart
router.put("/item/:inventoryProductId", requireAuth, updateCartItem); // Update cart item quantity
router.delete("/item/:inventoryProductId", requireAuth, removeFromCart); // Remove item from cart
router.delete("/clear", requireAuth, clearCart); // Clear entire cart
router.post("/checkout", requireAuth, checkoutCart); // Convert cart to order

// Test routes (without authentication for testing)
router.post("/test/add", addToCart); // Test route for adding to cart
router.post("/test/checkout", checkoutCart); // Test route for checkout

module.exports = router;
