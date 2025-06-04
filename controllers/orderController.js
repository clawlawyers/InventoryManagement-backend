const Order = require("../models/Order");
const Client = require("../models/Client");
const InventoryProduct = require("../models/InventoryProduct");
const { generateOrderInvoicePDF } = require("../utils/pdfGenerator");
const mongoose = require("mongoose");

// Create a new order using inventory products
const createOrder = async (req, res) => {
  try {
    const { products, clientId, paymentDueDate, companyId } = req.body;

    // Get user information from the authentication middleware
    // For testing without auth, provide default values
    const { user, type } = req.user || {
      user: { _id: new mongoose.Types.ObjectId(), name: "Test User" },
      type: "manager",
    };

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        message:
          "Products array is required and must contain at least one product",
      });
    }

    if (!clientId) {
      return res.status(400).json({
        message: "Client ID is required",
      });
    }

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    // Check if user is authorized (manager or salesman)
    if (type !== "manager" && type !== "salesman") {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can create orders",
      });
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // For salesmen, verify they can create orders for this client
    if (type === "salesman") {
      // Check if the client is assigned to this salesman
      if (
        client.salesman &&
        client.salesman.toString() !== user._id.toString()
      ) {
        return res.status(403).json({
          message:
            "Forbidden: You can only create orders for your assigned clients",
        });
      }
    }

    let orderProducts = [];
    let totalOrderAmount = 0;

    // Process each product in the order
    for (let i = 0; i < products.length; i++) {
      const productOrder = products[i];

      // Validate required fields
      if (!productOrder.inventoryProductId || !productOrder.quantity) {
        return res.status(400).json({
          message: `Product ${
            i + 1
          }: inventoryProductId and quantity are required`,
        });
      }

      if (productOrder.quantity <= 0) {
        return res.status(400).json({
          message: `Product ${i + 1}: Quantity must be a positive number`,
        });
      }

      // Find the inventory product
      const inventoryProduct = await InventoryProduct.findById(
        productOrder.inventoryProductId
      );
      if (!inventoryProduct) {
        return res.status(404).json({
          message: `Product ${i + 1}: Inventory product not found`,
        });
      }

      // Check if enough stock is available
      if (inventoryProduct.stock_amount < productOrder.quantity) {
        return res.status(400).json({
          message: `Product ${i + 1}: Insufficient stock. Available: ${
            inventoryProduct.stock_amount
          }, Requested: ${productOrder.quantity}`,
        });
      }

      // Use the price from inventory product or allow override
      const unitPrice = productOrder.unitPrice || inventoryProduct.price;
      if (unitPrice <= 0) {
        return res.status(400).json({
          message: `Product ${i + 1}: Unit price must be greater than 0`,
        });
      }

      const totalPrice = unitPrice * productOrder.quantity;

      orderProducts.push({
        inventoryProduct: inventoryProduct._id,
        quantity: productOrder.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
      });

      totalOrderAmount += totalPrice;
    }

    // Create the order with products array
    const orderData = {
      products: orderProducts,
      client: clientId,
      company: companyId,
      createdBy: user._id,
      creatorType: type === "manager" ? "Manager" : "SalesmanTextile",
      totalAmount: totalOrderAmount,
    };

    // Add payment due date if provided
    if (paymentDueDate) {
      orderData.paymentDueDate = new Date(paymentDueDate);
    }

    const newOrder = new Order(orderData);
    await newOrder.save();

    // Update inventory stock amounts
    for (let i = 0; i < products.length; i++) {
      const productOrder = products[i];
      await InventoryProduct.findByIdAndUpdate(
        productOrder.inventoryProductId,
        { $inc: { stock_amount: -productOrder.quantity } }
      );
    }

    // Populate the order with client, creator, and inventory product details for response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("client", "name phone firmName address")
      .populate("company", "name address GSTNumber")
      .populate("createdBy", "name email phone")
      .populate({
        path: "products.inventoryProduct",
        select:
          "bail_number design_code category_code lot_number stock_amount price",
      });

    res.status(201).json({
      message: "Order created successfully",
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
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all orders (for future use)
const getAllOrders = async (req, res) => {
  try {
    const { user, type } = req.user;
    const { companyId } = req.params;

    let orders;
    if (type === "manager") {
      // Managers can see only orders from their organization
      // Get all salesmen under this manager
      const salesmenIds = user.salesmen || [];

      // Find orders created by the manager or by salesmen under this manager
      orders = await Order.find({
        $or: [
          { createdBy: user._id, creatorType: "Manager", company: companyId },
          {
            createdBy: { $in: salesmenIds },
            creatorType: "SalesmanTextile",
            company: companyId,
          },
        ],
      })
        .populate("client", "name phone firmName address")
        .populate("company", "name address GSTNumber")
        .populate("createdBy", "name email phone")
        .populate({
          path: "products.inventoryProduct",
          select:
            "bail_number design_code category_code lot_number stock_amount price",
        })
        .populate({
          path: "payments",
          select:
            "amount paymentMethod paymentDate paymentReference notes status",
          populate: {
            path: "receivedBy",
            select: "name email phone",
          },
        })
        .sort({ createdAt: -1 });
    } else if (type === "salesman") {
      // Salesmen can only see orders they created
      orders = await Order.find({ createdBy: user._id, company: companyId })
        .populate("client", "name phone firmName address")
        .populate("company", "name address GSTNumber")
        .populate("createdBy", "name email phone")
        .populate({
          path: "products.inventoryProduct",
          select:
            "bail_number design_code category_code lot_number stock_amount price",
        })
        .populate({
          path: "payments",
          select:
            "amount paymentMethod paymentDate paymentReference notes status",
          populate: {
            path: "receivedBy",
            select: "name email phone",
          },
        })
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can view orders",
      });
    }

    res.json({
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all orders (for future use)
const getAllOrdersByClientId = async (req, res) => {
  try {
    const { user, type } = req.user;
    const { clientId, companyId } = req.params;

    let orders;
    if (type === "manager") {
      // Managers can see all orders
      orders = await Order.find({ client: clientId, company: companyId })
        .populate("client", "name phone firmName address")
        .populate("createdBy", "name email phone")
        .populate({
          path: "products.inventoryProduct",
          select:
            "bail_number design_code category_code lot_number stock_amount price",
        })
        .populate({
          path: "payments",
          select:
            "amount paymentMethod paymentDate paymentReference notes status",
          populate: {
            path: "receivedBy",
            select: "name email phone",
          },
        })
        .sort({ createdAt: -1 });
    } else if (type === "salesman") {
      // Salesmen can only see orders they created
      orders = await Order.find({
        createdBy: user._id,
        client: clientId,
        company: companyId,
      })
        .populate("client", "name phone firmName address")
        .populate("createdBy", "name email phone")
        .populate({
          path: "products.inventoryProduct",
          select:
            "bail_number design_code category_code lot_number stock_amount price",
        })
        .populate({
          path: "payments",
          select:
            "amount paymentMethod paymentDate paymentReference notes status",
          populate: {
            path: "receivedBy",
            select: "name email phone",
          },
        })
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can view orders",
      });
    }

    res.json({
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get order by ID (for future use)
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type } = req.user;

    const order = await Order.findById(id)
      .populate("client", "name phone firmName address")
      .populate("createdBy", "name email phone")
      .populate({
        path: "products.inventoryProduct",
        select:
          "bail_number design_code category_code lot_number stock_amount price",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (
      type === "salesman" &&
      order.createdBy._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: You can only view orders you created",
      });
    }

    res.json({
      message: "Order retrieved successfully",
      order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Generate PDF invoice for completed order
const generateOrderInvoice = async (req, res) => {
  try {
    console.log("=============================================");
    const { orderId } = req.params;
    const { user, type } = req.user;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    // Find the order with all necessary populated data
    const order = await Order.findById(orderId)
      .populate("client", "name phone firmName firmGSTNumber address")
      .populate("company", "name address GSTNumber")
      .populate("createdBy", "name email phone")
      .populate({
        path: "products.inventoryProduct",
        select:
          "bail_number design_code category_code lot_number stock_amount price",
      });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization - only allow access to orders the user can view
    if (
      type === "salesman" &&
      order.createdBy._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message:
          "Forbidden: You can only generate invoices for orders you created",
      });
    }

    // Check if order is completed
    if (order.status !== "completed") {
      return res.status(400).json({
        message: "Invoice can only be generated for completed orders",
        currentStatus: order.status,
      });
    }

    // Generate PDF in memory
    console.log(`📄 Generating invoice for order ${orderId}`);
    const { buffer, filename, size } = await generateOrderInvoicePDF(order);

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", size);

    // Send the PDF buffer directly to response
    console.log(
      `✅ PDF invoice generated and sent successfully for order ${orderId} (${size} bytes)`
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error generating order invoice:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete an order
const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { user, type } = req.user;

    // Find the order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check authorization
    if (
      type === "salesman" &&
      order.createdBy.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: You can only delete orders you created",
      });
    }

    // Delete the order
    await Order.findByIdAndDelete(orderId);

    // Delete associated payments
    await Payment.deleteMany({ order: new mongoose.Types.ObjectId(orderId) });

    res.json({
      message: "Order deleted successfully",
      orderId: orderId,
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getAllOrdersByClientId,
  generateOrderInvoice,
  deleteOrder,
};
