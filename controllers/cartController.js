const Cart = require("../models/Cart");
const InventoryProduct = require("../models/InventoryProduct");
const Order = require("../models/Order");
const Client = require("../models/Client");
const mongoose = require("mongoose");

// Get user's cart
const getCart = async (req, res) => {
  try {
    const { user, type } = req.user;

    let cart = await Cart.findOne({
      user: user._id,
      userType: type === "manager" ? "Manager" : "Salesman",
    }).populate({
      path: "items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    if (!cart) {
      // Create empty cart if none exists
      cart = new Cart({
        user: user._id,
        userType: type === "manager" ? "Manager" : "Salesman",
        items: [],
      });
      await cart.save();
    }

    res.json({
      message: "Cart retrieved successfully",
      cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { inventoryProductId, quantity } = req.body;
    const { user, type } = req.user;

    // Validate required fields
    if (!inventoryProductId || !quantity) {
      return res.status(400).json({
        message: "Inventory product ID and quantity are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // Check if inventory product exists and has sufficient stock
    const inventoryProduct = await InventoryProduct.findById(
      inventoryProductId
    );
    if (!inventoryProduct) {
      return res.status(404).json({
        message: "Inventory product not found",
      });
    }

    if (inventoryProduct.stock_amount < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${inventoryProduct.stock_amount}`,
      });
    }

    // Get or create user's cart
    let cart = await Cart.findOne({
      user: user._id,
      userType: type === "manager" ? "Manager" : "Salesman",
    });

    if (!cart) {
      cart = new Cart({
        user: user._id,
        userType: type === "manager" ? "Manager" : "Salesman",
        items: [],
      });
    }

    // Check if adding this quantity would exceed available stock
    const existingItem = cart.items.find(
      (item) => item.inventoryProduct.toString() === inventoryProductId
    );
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + quantity;

    if (totalQuantity > inventoryProduct.stock_amount) {
      return res.status(400).json({
        message: `Cannot add ${quantity} items. Total would be ${totalQuantity}, but only ${inventoryProduct.stock_amount} available`,
      });
    }

    // Add item to cart
    cart.addItem(inventoryProductId, quantity, inventoryProduct.price);
    await cart.save();

    // Populate the cart for response
    await cart.populate({
      path: "items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    res.status(201).json({
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { inventoryProductId } = req.params;
    const { quantity } = req.body;
    const { user, type } = req.user;

    // Validate quantity
    if (quantity < 0) {
      return res.status(400).json({
        message: "Quantity cannot be negative",
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({
      user: user._id,
      userType: type === "manager" ? "Manager" : "Salesman",
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // If quantity > 0, check stock availability
    if (quantity > 0) {
      const inventoryProduct = await InventoryProduct.findById(
        inventoryProductId
      );
      if (!inventoryProduct) {
        return res.status(404).json({
          message: "Inventory product not found",
        });
      }

      if (quantity > inventoryProduct.stock_amount) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${inventoryProduct.stock_amount}`,
        });
      }
    }

    // Update item quantity
    const updated = cart.updateItemQuantity(inventoryProductId, quantity);
    if (!updated) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    await cart.save();

    // Populate the cart for response
    await cart.populate({
      path: "items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    res.json({
      message:
        quantity === 0
          ? "Item removed from cart"
          : "Cart item updated successfully",
      cart,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { inventoryProductId } = req.params;
    const { user, type } = req.user;

    // Get user's cart
    const cart = await Cart.findOne({
      user: user._id,
      userType: type === "manager" ? "Manager" : "Salesman",
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Remove item from cart
    const removed = cart.removeItem(inventoryProductId);
    if (!removed) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    await cart.save();

    // Populate the cart for response
    await cart.populate({
      path: "items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    res.json({
      message: "Item removed from cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Clear entire cart
const clearCart = async (req, res) => {
  try {
    const { user, type } = req.user;

    // Get user's cart
    const cart = await Cart.findOne({
      user: user._id,
      userType: type === "manager" ? "Manager" : "Salesman",
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Clear cart
    cart.clearCart();
    await cart.save();

    res.json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Convert cart to order (checkout)
const checkoutCart = async (req, res) => {
  try {
    const { clientId, paymentDueDate } = req.body;
    const { user, type } = req.user;

    // Validate required fields
    if (!clientId) {
      return res.status(400).json({
        message: "Client ID is required for checkout",
      });
    }

    // Verify client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({
      user: user._id,
      userType: type === "manager" ? "Manager" : "Salesman",
    }).populate("items.inventoryProduct");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // Verify stock availability for all items
    for (const item of cart.items) {
      if (item.quantity > item.inventoryProduct.stock_amount) {
        return res.status(400).json({
          message: `Insufficient stock for ${item.inventoryProduct.bail_number}. Available: ${item.inventoryProduct.stock_amount}, Required: ${item.quantity}`,
        });
      }
    }

    // Prepare order products array
    const orderProducts = cart.items.map((item) => ({
      inventoryProduct: item.inventoryProduct._id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    // Create order data
    const orderData = {
      products: orderProducts,
      client: clientId,
      createdBy: user._id,
      creatorType: type === "manager" ? "Manager" : "Salesman",
      totalAmount: cart.totalAmount,
    };

    // Add payment due date if provided
    if (paymentDueDate) {
      orderData.paymentDueDate = new Date(paymentDueDate);
    }

    // Create the order
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Update inventory stock amounts
    for (const item of cart.items) {
      await InventoryProduct.findByIdAndUpdate(item.inventoryProduct._id, {
        $inc: { stock_amount: -item.quantity },
      });
    }

    // Clear the cart after successful order creation
    cart.clearCart();
    await cart.save();

    // Populate the order with details for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("client", "name phone firmName address")
      .populate("createdBy", "name email phone")
      .populate({
        path: "products.inventoryProduct",
        select:
          "bail_number design_code category_code lot_number stock_amount price",
      });

    res.status(201).json({
      message: "Order created successfully from cart",
      order: populatedOrder,
      productCount: orderProducts.length,
      paymentSummary: {
        totalAmount: newOrder.totalAmount,
        paidAmount: newOrder.paidAmount,
        dueAmount: newOrder.dueAmount,
        paymentStatus: newOrder.paymentStatus,
        paymentDueDate: newOrder.paymentDueDate,
      },
    });
  } catch (error) {
    console.error("Checkout cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkoutCart,
};
