const Order = require("../models/Order");
const mongoose = require("mongoose");
const InventoryProduct = require("../models/InventoryProduct");
const Company = require("../models/Company");

// Get sales analytics for a specific product
const getProductSalesAnalytics = async (req, res) => {
  try {
    const { productId, startDate, endDate, companyId } = req.query;

    if (!productId || !companyId) {
      return res.status(400).json({
        message: "Product ID and Company ID are required",
      });
    }

    // Validate ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(productId) ||
      !mongoose.Types.ObjectId.isValid(companyId)
    ) {
      return res.status(400).json({
        message: "Invalid Product ID or Company ID format",
      });
    }

    const matchQuery = {
      company: new mongoose.Types.ObjectId(companyId),
      "products.inventoryProduct": new mongoose.Types.ObjectId(productId),
    };

    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Debug: Check if there are any orders for this product and company
    const orderCount = await Order.countDocuments({
      company: new mongoose.Types.ObjectId(companyId),
      "products.inventoryProduct": new mongoose.Types.ObjectId(productId),
    });
    console.log(
      `Found ${orderCount} orders for product ${productId} in company ${companyId}`
    );

    if (orderCount === 0) {
      return res.json({
        message: "No orders found for this product in this company",
        salesData: [],
        totals: { totalQuantity: 0, totalAmount: 0, totalOrders: 0 },
      });
    }

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: "$products" },
      {
        $match: {
          "products.inventoryProduct": new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          totalQuantity: { $sum: "$products.quantity" },
          totalAmount: { $sum: "$products.totalPrice" },
          averagePrice: { $avg: "$products.unitPrice" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day",
            },
          },
          totalQuantity: 1,
          totalAmount: 1,
          averagePrice: 1,
          orderCount: 1,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // Calculate overall totals
    const totals = salesData.reduce(
      (acc, data) => {
        acc.totalQuantity += data.totalQuantity;
        acc.totalAmount += data.totalAmount;
        acc.totalOrders += data.orderCount;
        return acc;
      },
      { totalQuantity: 0, totalAmount: 0, totalOrders: 0 }
    );

    res.json({
      message: "Sales analytics retrieved successfully",
      salesData,
      totals,
    });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get sales analytics for all products
const getAllProductsSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    // Debug: Check if companyId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid Company ID format",
      });
    }

    const matchQuery = {
      company: new mongoose.Types.ObjectId(companyId),
    };

    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Debug: First check if there are any orders for this company
    const orderCount = await Order.countDocuments({
      company: new mongoose.Types.ObjectId(companyId),
    });
    console.log(`Found ${orderCount} orders for company ${companyId}`);

    if (orderCount === 0) {
      return res.json({
        message: "No orders found for this company",
        salesData: [],
        totals: { totalQuantity: 0, totalAmount: 0, totalOrders: 0 },
      });
    }

    // Debug: Get a sample order to check its structure
    const sampleOrder = await Order.findOne({
      company: new mongoose.Types.ObjectId(companyId),
    });
    console.log(
      "Sample order structure:",
      JSON.stringify(sampleOrder, null, 2)
    );

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.inventoryProduct",
          totalQuantity: { $sum: "$products.quantity" },
          totalAmount: { $sum: "$products.totalPrice" },
          averagePrice: { $avg: "$products.unitPrice" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "inventoryproducts",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          totalAmount: 1,
          averagePrice: 1,
          orderCount: 1,
          "productDetails.bail_number": 1,
          "productDetails.design_code": 1,
          "productDetails.category_code": 1,
        },
      },
    ]);

    console.log("Aggregation result:", JSON.stringify(salesData, null, 2));

    // Calculate overall totals
    const totals = salesData.reduce(
      (acc, data) => {
        acc.totalQuantity += data.totalQuantity;
        acc.totalAmount += data.totalAmount;
        acc.totalOrders += data.orderCount;
        return acc;
      },
      { totalQuantity: 0, totalAmount: 0, totalOrders: 0 }
    );

    res.json({
      message: "Sales analytics retrieved successfully",
      salesData,
      totals,
    });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get order payment statistics
const getOrderPaymentStats = async (req, res) => {
  try {
    const { companyId, startDate, endDate } = req.query;

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid Company ID format",
      });
    }

    const matchQuery = {
      company: new mongoose.Types.ObjectId(companyId),
    };

    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const paymentStats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          dueAmount: { $sum: "$dueAmount" },
          paidAmount: { $sum: "$paidAmount" },
        },
      },
      {
        $project: {
          _id: 0,
          paymentStatus: "$_id",
          count: 1,
          totalAmount: 1,
          dueAmount: 1,
          paidAmount: 1,
        },
      },
    ]);

    // Get total orders count
    const totalOrders = await Order.countDocuments(matchQuery);

    // Calculate summary
    const summary = {
      totalOrders,
      totalAmount: 0,
      totalDueAmount: 0,
      totalPaidAmount: 0,
      byStatus: {},
    };

    // Process payment stats
    paymentStats.forEach((stat) => {
      summary.byStatus[stat.paymentStatus] = {
        count: stat.count,
        totalAmount: stat.totalAmount,
        dueAmount: stat.dueAmount,
        paidAmount: stat.paidAmount,
      };
      summary.totalAmount += stat.totalAmount;
      summary.totalDueAmount += stat.dueAmount;
      summary.totalPaidAmount += stat.paidAmount;
    });

    res.json({
      message: "Order payment statistics retrieved successfully",
      summary,
      detailedStats: paymentStats,
    });
  } catch (error) {
    console.error("Error fetching order payment statistics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get cumulative stock and order statistics
const getCumulativeStockStats = async (req, res) => {
  try {
    const { companyId, startDate, endDate, productId, designCode } = req.query;

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid Company ID format",
      });
    }

    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();

    if (!startDate) {
      start.setDate(1); // Default to the first day of the current month
      start.setHours(0, 0, 0, 0);
    }
    if (!endDate) {
      end.setMonth(end.getMonth() + 1, 0); // Default to the last day of the current month
    }
    end.setHours(23, 59, 59, 999); // End of the day

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid startDate or endDate format",
      });
    }

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid startDate or endDate format",
      });
    }

    // Get all inventory products for the company
    const company = await Company.findById(
      mongoose.Types.ObjectId.createFromHexString(companyId)
    ).populate({
      path: "inventory",
      populate: {
        path: "products",
      },
    });

    console.log("Company found:", company ? "yes" : "no");
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    console.log("Inventory found:", company.inventory ? "yes" : "no");
    if (!company.inventory) {
      return res.status(404).json({
        message: "Inventory not found for this company",
      });
    }

    let inventoryProducts = company.inventory.products || [];
    let targetProductId = null;

    // Handle productId (bail_number) or designCode filtering
    if (productId) {
      const productByBailNumber = inventoryProducts.find(
        (p) => p && p.bail_number === productId
      );
      if (!productByBailNumber) {
        return res
          .status(404)
          .json({ message: "Product with provided bail number not found" });
      }
      inventoryProducts = [productByBailNumber]; // Filter to only this product
      targetProductId = productByBailNumber._id;
    } else if (designCode) {
      inventoryProducts = inventoryProducts.filter(
        (p) => p && p.design_code === designCode
      );
    }

    console.log(
      "Found inventory products (filtered):",
      inventoryProducts.length
    );

    const orderMatchQuery = {
      company: mongoose.Types.ObjectId.createFromHexString(companyId),
    };

    if (targetProductId) {
      // Use the found _id for filtering orders
      orderMatchQuery["products.inventoryProduct"] = targetProductId;
    } else if (designCode) {
      // If filtering by designCode, we need to ensure orders only contain products of that design.
      // This is handled by filtering `inventoryProducts` first, and then the loops will naturally
      // only consider relevant products. No direct orderMatchQuery filter by designCode is needed here.
    }

    // Get all orders for the company within the specified date range
    const orders = await Order.find({
      ...orderMatchQuery,
      createdAt: { $gte: start, $lte: end },
    }).populate("products.inventoryProduct");

    // Get all orders before the start date to calculate initial stock
    const ordersBeforeStart = await Order.find({
      ...orderMatchQuery,
      createdAt: { $lt: start },
    }).populate("products.inventoryProduct");

    console.log("Found orders within range:", orders.length);
    console.log("Found orders before start date:", ordersBeforeStart.length);

    // Initialize overall stats
    const stockTimeSeries = []; // To store stock data by 3-day intervals

    // Calculate initial total stock and value for the filtered products at the start date
    let currentOverallStock = 0;
    let currentOverallStockValue = 0;

    for (const product of inventoryProducts) {
      if (!product) continue;

      let productInitialStock = product.stock_amount;
      let productInitialStockValue = product.stock_amount * product.price;

      // Subtract quantities from orders placed before the start date for this specific product
      ordersBeforeStart.forEach((order) => {
        if (!order || !order.products) return;
        const orderProduct = order.products.find(
          (p) =>
            p &&
            p.inventoryProduct !== null &&
            p.inventoryProduct._id &&
            p.inventoryProduct._id.toString() === product._id.toString()
        );
        if (orderProduct) {
          productInitialStock -= orderProduct.quantity;
          productInitialStockValue -= orderProduct.totalPrice;
        }
      });
      currentOverallStock += productInitialStock;
      currentOverallStockValue += productInitialStockValue;
    }

    // Initialize overall stats with the calculated initial stock
    const overallStats = {
      totalProducts: inventoryProducts.length,
      totalStock: currentOverallStock,
      totalStockValue: currentOverallStockValue,
      totalOrders: orders.length, // Only orders within the range
      totalOrderedQuantity: 0,
      totalOrderValue: 0,
    };

    // Process orders within the date range and build time series
    let currentDate = new Date(start);
    while (currentDate <= end) {
      const intervalEnd = new Date(currentDate);
      intervalEnd.setDate(intervalEnd.getDate() + 2); // 3-day interval (current day + 2 more days)
      intervalEnd.setHours(23, 59, 59, 999); // End of the day for the interval

      let orderedQuantityInInterval = 0;
      let orderedValueInInterval = 0;

      orders.forEach((order) => {
        if (
          order.createdAt >= currentDate &&
          order.createdAt <= intervalEnd &&
          order.createdAt <= end // Ensure we don't go past the overall end date
        ) {
          order.products.forEach((p) => {
            if (p && p.inventoryProduct !== null && p.inventoryProduct._id) {
              // Check if this product is part of the filtered inventoryProducts
              const isRelevantProduct = inventoryProducts.some(
                (invProd) =>
                  invProd._id.toString() === p.inventoryProduct._id.toString()
              );

              if (isRelevantProduct) {
                orderedQuantityInInterval += p.quantity;
                orderedValueInInterval += p.totalPrice;
              }
            }
          });
        }
      });

      currentOverallStock -= orderedQuantityInInterval;
      currentOverallStockValue -= orderedValueInInterval;

      overallStats.totalOrderedQuantity += orderedQuantityInInterval;
      overallStats.totalOrderValue += orderedValueInInterval;

      stockTimeSeries.push({
        date: currentDate.toISOString().split("T")[0], // YYYY-MM-DD
        total_remaining_stock: currentOverallStock,
        total_remaining_stock_value: currentOverallStockValue,
      });

      currentDate.setDate(currentDate.getDate() + 3); // Move to the next 3-day interval
    }

    const monthStartStock = overallStats.totalStock;
    const monthStartStockValue = overallStats.totalStockValue;
    const monthEndStock =
      stockTimeSeries.length > 0
        ? stockTimeSeries[stockTimeSeries.length - 1].total_remaining_stock
        : monthStartStock;
    const monthEndStockValue =
      stockTimeSeries.length > 0
        ? stockTimeSeries[stockTimeSeries.length - 1]
            .total_remaining_stock_value
        : monthStartStockValue;

    res.json({
      message: "Cumulative stock statistics retrieved successfully",
      stats: overallStats,
      stockTimeSeries: stockTimeSeries,
      monthlyValues: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        monthStartStock,
        monthStartStockValue,
        monthEndStock,
        monthEndStockValue,
      },
    });
  } catch (error) {
    console.error("Error fetching cumulative stock statistics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get product-wise stock statistics
const getProductWiseStockStats = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid Company ID format",
      });
    }

    // Get all inventory products for the company
    const company = await Company.findById(
      mongoose.Types.ObjectId.createFromHexString(companyId)
    ).populate({
      path: "inventory",
      populate: {
        path: "products",
      },
    });

    if (!company || !company.inventory) {
      return res.status(404).json({
        message: "Company or inventory not found",
      });
    }

    const inventoryProducts = company.inventory.products || [];
    console.log("Found inventory products:", inventoryProducts.length);

    // Get all orders for the company
    const orders = await Order.find({
      company: mongoose.Types.ObjectId.createFromHexString(companyId),
    }).populate("products.inventoryProduct");

    // Initialize overall stats
    const overallStats = {
      totalProducts: inventoryProducts.length,
      totalStock: 0,
      totalStockValue: 0,
      totalOrders: 0,
      totalOrderedQuantity: 0,
      totalOrderValue: 0,
    };

    // Process each product
    for (const product of inventoryProducts) {
      if (!product) continue;

      let productOrdered = 0;
      let productOrderValue = 0;

      // Calculate orders for this product
      orders.forEach((order) => {
        if (!order || !order.products) return;

        const orderProduct = order.products.find(
          (p) =>
            p &&
            p.inventoryProduct &&
            p.inventoryProduct._id &&
            p.inventoryProduct._id.toString() === product._id.toString()
        );

        if (orderProduct) {
          productOrdered += orderProduct.quantity;
          productOrderValue += orderProduct.totalPrice;
        }
      });

      overallStats.totalStock += product.stock_amount;
      overallStats.totalStockValue += product.stock_amount * product.price;
      overallStats.totalOrderedQuantity += productOrdered;
      overallStats.totalOrderValue += productOrderValue;
    }

    overallStats.totalOrders = orders.length;

    res.json({
      message: "Product-wise stock statistics retrieved successfully",
      stats: overallStats,
    });
  } catch (error) {
    console.error("Error fetching product-wise stock statistics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get design-wise stock statistics
const getDesignWiseStockStats = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required",
      });
    }

    // Validate companyId
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({
        message: "Invalid Company ID format",
      });
    }

    // Get all inventory products for the company
    const company = await Company.findById(
      mongoose.Types.ObjectId.createFromHexString(companyId)
    ).populate({
      path: "inventory",
      populate: {
        path: "products",
      },
    });

    if (!company || !company.inventory) {
      return res.status(404).json({
        message: "Company or inventory not found",
      });
    }

    const inventoryProducts = company.inventory.products || [];
    console.log("Found inventory products:", inventoryProducts.length);

    // Get all orders for the company
    const orders = await Order.find({
      company: mongoose.Types.ObjectId.createFromHexString(companyId),
    }).populate("products.inventoryProduct");

    // Initialize stats
    const stats = {
      totalDesigns: 0,
      totalStock: 0,
      totalStockValue: 0,
      totalOrders: 0,
      totalOrderedQuantity: 0,
      totalOrderValue: 0,
    };

    // Track unique design codes
    const uniqueDesigns = new Set();

    // Process each product
    for (const product of inventoryProducts) {
      if (!product) continue;

      const designCode = product.design_code || "Unknown";
      uniqueDesigns.add(designCode);

      let productOrdered = 0;
      let productOrderValue = 0;

      // Calculate orders for this product
      orders.forEach((order) => {
        if (!order || !order.products) return;

        const orderProduct = order.products.find(
          (p) =>
            p &&
            p.inventoryProduct &&
            p.inventoryProduct._id &&
            p.inventoryProduct._id.toString() === product._id.toString()
        );

        if (orderProduct) {
          productOrdered += orderProduct.quantity;
          productOrderValue += orderProduct.totalPrice;
        }
      });

      // Update total stats
      stats.totalStock += product.stock_amount;
      stats.totalStockValue += product.stock_amount * product.price;
      stats.totalOrderedQuantity += productOrdered;
      stats.totalOrderValue += productOrderValue;
    }

    stats.totalDesigns = uniqueDesigns.size;
    stats.totalOrders = orders.length;

    res.json({
      message: "Design-wise stock statistics retrieved successfully",
      stats,
    });
  } catch (error) {
    console.error("Error fetching design-wise stock statistics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getProductSalesAnalytics,
  getAllProductsSalesAnalytics,
  getOrderPaymentStats,
  getCumulativeStockStats,
  getProductWiseStockStats,
  getDesignWiseStockStats,
};
