const Order = require("../models/Order");
const mongoose = require("mongoose");

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
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(companyId)) {
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
      "products.inventoryProduct": new mongoose.Types.ObjectId(productId)
    });
    console.log(`Found ${orderCount} orders for product ${productId} in company ${companyId}`);

    if (orderCount === 0) {
      return res.json({
        message: "No orders found for this product in this company",
        salesData: [],
        totals: { totalQuantity: 0, totalAmount: 0, totalOrders: 0 }
      });
    }

    const salesData = await Order.aggregate([
      { $match: matchQuery },
      { $unwind: "$products" },
      { $match: { "products.inventoryProduct": new mongoose.Types.ObjectId(productId) } },
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
    const orderCount = await Order.countDocuments({ company: new mongoose.Types.ObjectId(companyId) });
    console.log(`Found ${orderCount} orders for company ${companyId}`);

    if (orderCount === 0) {
      return res.json({
        message: "No orders found for this company",
        salesData: [],
        totals: { totalQuantity: 0, totalAmount: 0, totalOrders: 0 }
      });
    }

    // Debug: Get a sample order to check its structure
    const sampleOrder = await Order.findOne({ company: new mongoose.Types.ObjectId(companyId) });
    console.log('Sample order structure:', JSON.stringify(sampleOrder, null, 2));

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

    console.log('Aggregation result:', JSON.stringify(salesData, null, 2));

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

module.exports = {
  getProductSalesAnalytics,
  getAllProductsSalesAnalytics,
}; 