const Client = require("../models/Client");
const InventoryProduct = require("../models/InventoryProduct");
const Order = require("../models/Order");

// Helper function to update cart totals
const updateCartTotals = (cart) => {
  cart.totalAmount = 0;
  cart.totalItems = 0;
  cart.updatedAt = Date.now();

  cart.items.forEach((item) => {
    cart.totalAmount += item.totalPrice;
    cart.totalItems += item.quantity;
  });
};

// Get client's cart
const getCart = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { user, type } = req.user || {
      user: { _id: "507f1f77bcf86cd799439011" }, // Default test user ID
      type: "manager",
    };

    // Find client and populate cart items
    const client = await Client.findById(clientId).populate({
      path: "cart.items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Authorization check - managers can access all, salesmen only their assigned clients
    if (
      type === "salesman" &&
      client.salesman &&
      client.salesman.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only access carts of your assigned clients",
      });
    }

    // Initialize cart if it doesn't exist
    if (!client.cart) {
      client.cart = {
        items: [],
        totalAmount: 0,
        totalItems: 0,
        updatedAt: Date.now(),
      };
      await client.save();
    }

    res.json({
      message: "Cart retrieved successfully",
      clientId: client._id,
      clientName: client.name,
      cart: client.cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add item to client's cart
const addToCart = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { inventoryProductId, quantity } = req.body;
    const { user, type } = req.user || {
      user: { _id: "507f1f77bcf86cd799439011" }, // Default test user ID
      type: "manager",
    };

    // Validate input
    if (!inventoryProductId || !quantity || quantity <= 0) {
      return res.status(400).json({
        message: "Inventory product ID and valid quantity are required",
      });
    }

    // Find client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Authorization check
    if (
      type === "salesman" &&
      client.salesman &&
      client.salesman.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only manage carts of your assigned clients",
      });
    }

    // Find inventory product
    const inventoryProduct = await InventoryProduct.findById(
      inventoryProductId
    );
    if (!inventoryProduct) {
      return res.status(404).json({
        message: "Inventory product not found",
      });
    }

    // Check stock availability
    if (inventoryProduct.stock_amount < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${inventoryProduct.stock_amount}`,
      });
    }

    // Check if adding this quantity would exceed available stock
    const existingItem = client.cart?.items?.find(
      (item) => item.inventoryProduct.toString() === inventoryProductId
    );
    const currentCartQuantity = existingItem ? existingItem.quantity : 0;
    const totalQuantity = currentCartQuantity + quantity;

    if (totalQuantity > inventoryProduct.stock_amount) {
      return res.status(400).json({
        message: `Cannot add ${quantity} items. Total would be ${totalQuantity}, but only ${inventoryProduct.stock_amount} available`,
      });
    }

    // Initialize cart if it doesn't exist
    if (!client.cart) {
      client.cart = {
        items: [],
        totalAmount: 0,
        totalItems: 0,
        updatedAt: Date.now(),
      };
    }

    // Add item to cart
    const existingItemIndex = client.cart.items.findIndex(
      (item) =>
        item.inventoryProduct.toString() === inventoryProductId.toString()
    );

    if (existingItemIndex > -1) {
      // Update existing item
      client.cart.items[existingItemIndex].quantity += quantity;
      client.cart.items[existingItemIndex].totalPrice =
        client.cart.items[existingItemIndex].quantity *
        client.cart.items[existingItemIndex].unitPrice;
    } else {
      // Add new item
      client.cart.items.push({
        inventoryProduct: inventoryProductId,
        quantity,
        unitPrice: inventoryProduct.price,
        totalPrice: quantity * inventoryProduct.price,
      });
    }

    // Update cart totals
    updateCartTotals(client.cart);

    await client.save();

    // Populate the cart for response
    await client.populate({
      path: "cart.items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    res.status(201).json({
      message: "Item added to cart successfully",
      clientId: client._id,
      clientName: client.name,
      cart: client.cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { clientId, inventoryProductId } = req.params;
    const { quantity } = req.body;
    const { user, type } = req.user || {
      user: { _id: "507f1f77bcf86cd799439011" }, // Default test user ID
      type: "manager",
    };

    // Validate quantity
    if (quantity < 0) {
      return res.status(400).json({
        message: "Quantity cannot be negative",
      });
    }

    // Find client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Authorization check
    if (
      type === "salesman" &&
      client.salesman &&
      client.salesman.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only manage carts of your assigned clients",
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

    // Initialize cart if it doesn't exist
    if (!client.cart || !client.cart.items) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Update item quantity
    const itemIndex = client.cart.items.findIndex(
      (item) =>
        item.inventoryProduct.toString() === inventoryProductId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      client.cart.items.splice(itemIndex, 1);
    } else {
      // Update quantity and total price
      client.cart.items[itemIndex].quantity = quantity;
      client.cart.items[itemIndex].totalPrice =
        client.cart.items[itemIndex].quantity *
        client.cart.items[itemIndex].unitPrice;
    }

    // Update cart totals
    updateCartTotals(client.cart);

    await client.save();

    // Populate the cart for response
    await client.populate({
      path: "cart.items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    res.json({
      message:
        quantity === 0
          ? "Item removed from cart"
          : "Cart item updated successfully",
      clientId: client._id,
      clientName: client.name,
      cart: client.cart,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove item from client's cart
const removeFromCart = async (req, res) => {
  try {
    const { clientId, inventoryProductId } = req.params;
    const { user, type } = req.user || {
      user: { _id: "507f1f77bcf86cd799439011" }, // Default test user ID
      type: "manager",
    };

    // Find client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Authorization check
    if (
      type === "salesman" &&
      client.salesman &&
      client.salesman.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only manage carts of your assigned clients",
      });
    }

    // Initialize cart if it doesn't exist
    if (!client.cart || !client.cart.items) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    // Remove item from cart
    const itemIndex = client.cart.items.findIndex(
      (item) =>
        item.inventoryProduct.toString() === inventoryProductId.toString()
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    client.cart.items.splice(itemIndex, 1);

    // Update cart totals
    updateCartTotals(client.cart);

    await client.save();

    // Populate the cart for response
    await client.populate({
      path: "cart.items.inventoryProduct",
      select:
        "bail_number design_code category_code lot_number stock_amount price",
    });

    res.json({
      message: "Item removed from cart successfully",
      clientId: client._id,
      clientName: client.name,
      cart: client.cart,
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Clear client's cart
const clearCart = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { user, type } = req.user || {
      user: { _id: "507f1f77bcf86cd799439011" }, // Default test user ID
      type: "manager",
    };

    // Find client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Authorization check
    if (
      type === "salesman" &&
      client.salesman &&
      client.salesman.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only manage carts of your assigned clients",
      });
    }

    // Clear cart
    client.cart = {
      items: [],
      totalAmount: 0,
      totalItems: 0,
      updatedAt: Date.now(),
    };
    await client.save();

    res.json({
      message: "Cart cleared successfully",
      clientId: client._id,
      clientName: client.name,
      cart: client.cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Checkout client's cart (convert to order)
const checkoutCart = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { paymentDueDate, cartItems } = req.body;
    const { user, type } = req.user || {
      user: { _id: "507f1f77bcf86cd799439011" }, // Default test user ID
      type: "manager",
    };

    // Find client
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Authorization check
    if (
      type === "salesman" &&
      client.salesman &&
      client.salesman.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only checkout carts of your assigned clients",
      });
    }

    // Check if cart items were provided
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        message: "Cart items are required and cannot be empty",
      });
    }

    // Calculate total amount
    let totalAmount = 0;
    const orderProducts = [];

    // Process each cart item
    for (const item of cartItems) {
      // Validate required fields
      if (
        !item.inventoryProduct ||
        !item.inventoryProduct._id ||
        !item.quantity
      ) {
        return res.status(400).json({
          message: "Each cart item must have inventoryProduct._id and quantity",
        });
      }

      // Get inventory product from database to verify stock
      const inventoryProduct = await InventoryProduct.findById(
        item.inventoryProduct._id
      );
      if (!inventoryProduct) {
        return res.status(404).json({
          message: `Inventory product not found: ${item.inventoryProduct._id}`,
        });
      }

      // Check stock availability
      if (item.quantity > inventoryProduct.stock_amount) {
        return res.status(400).json({
          message: `Insufficient stock for ${inventoryProduct.bail_number}. Available: ${inventoryProduct.stock_amount}, Required: ${item.quantity}`,
        });
      }

      // Use provided unit price or get from inventory product
      const unitPrice = item.unitPrice || inventoryProduct.price || 0;
      const totalPrice = unitPrice * item.quantity;

      // Add to order products
      orderProducts.push({
        inventoryProduct: inventoryProduct._id,
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
      });

      totalAmount += totalPrice;
    }

    // Create order
    const order = new Order({
      products: orderProducts,
      client: client._id,
      createdBy: user._id,
      creatorType: type === "manager" ? "Manager" : "Salesman",
      totalAmount: totalAmount,
      paymentDueDate:
        paymentDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
    });

    await order.save();

    // Update inventory stock
    for (const item of cartItems) {
      await InventoryProduct.findByIdAndUpdate(item.inventoryProduct._id, {
        $inc: { stock_amount: -item.quantity },
      });
    }

    // Populate order for response
    await order.populate([
      {
        path: "products.inventoryProduct",
        select: "bail_number design_code category_code lot_number price",
      },
      {
        path: "client",
        select: "name phone email address",
      },
    ]);
    client.cart = {
      items: [],
      totalAmount: 0,
      totalItems: 0,
      updatedAt: Date.now(),
    };
    await client.save();

    res.status(201).json({
      message: "Cart checked out successfully",
      order,
      clientId: client._id,
      clientName: client.name,
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
