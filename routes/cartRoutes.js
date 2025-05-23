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
router.get("/:clientId/cart", requireAuth, getCart); // Get client's cart
router.post("/:clientId/cart/add", requireAuth, addToCart); // Add item to client's cart
router.put("/:clientId/cart/item/:inventoryProductId", requireAuth, updateCartItem); // Update cart item quantity
router.delete("/:clientId/cart/item/:inventoryProductId", requireAuth, removeFromCart); // Remove item from cart
router.delete("/:clientId/cart/clear", requireAuth, clearCart); // Clear client's entire cart
router.post("/:clientId/cart/checkout", requireAuth, checkoutCart); // Convert client cart to order

// Test routes (without authentication for testing)
router.get("/:clientId/cart/test", getCart); // Test route for getting cart
router.post("/:clientId/cart/test/add", addToCart); // Test route for adding to cart
router.put("/:clientId/cart/test/item/:inventoryProductId", updateCartItem); // Test route for updating cart item
router.delete("/:clientId/cart/test/item/:inventoryProductId", removeFromCart); // Test route for removing from cart
router.delete("/:clientId/cart/test/clear", clearCart); // Test route for clearing cart
router.post("/:clientId/cart/test/checkout", checkoutCart); // Test route for checkout

module.exports = router;
