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
      byStatus: {}
    };

    // Process payment stats
    paymentStats.forEach(stat => {
      summary.byStatus[stat.paymentStatus] = {
        count: stat.count,
        totalAmount: stat.totalAmount,
        dueAmount: stat.dueAmount,
        paidAmount: stat.paidAmount
      };
      summary.totalAmount += stat.totalAmount;
      summary.totalDueAmount += stat.dueAmount;
      summary.totalPaidAmount += stat.paidAmount;
    });

    res.json({
      message: "Order payment statistics retrieved successfully",
      summary,
      detailedStats: paymentStats
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
    const company = await Company.findById(mongoose.Types.ObjectId.createFromHexString(companyId))
      .populate({
        path: 'inventory',
        populate: {
          path: 'products'
        }
      });

    console.log('Company found:', company ? 'yes' : 'no');
    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    console.log('Inventory found:', company.inventory ? 'yes' : 'no');
    if (!company.inventory) {
      return res.status(404).json({
        message: "Inventory not found for this company"
      });
    }

    const inventoryProducts = company.inventory.products || [];
    console.log('Found inventory products:', inventoryProducts.length);

    // Get all orders for the company
    const orders = await Order.find({
      company: mongoose.Types.ObjectId.createFromHexString(companyId)
    }).populate('products.inventoryProduct');

    console.log('Found orders:', orders.length);

    // Initialize overall stats
    const overallStats = {
      totalProducts: inventoryProducts.length,
      totalStock: 0,
      totalStockValue: 0,
      totalOrders: 0,
      totalOrderedQuantity: 0,
      totalOrderValue: 0
    };

    // Process each product
    for (const product of inventoryProducts) {
      if (!product) {
        console.log('Skipping null product');
        continue;
      }
      console.log('Processing product:', {
        id: product._id,
        bail: product.bail_number,
        stock: product.stock_amount,
        price: product.price,
        stockValue: product.stock_amount * product.price
      });

      // Calculate orders for this product
      orders.forEach(order => {
        if (!order || !order.products) return;
        
        const orderProduct = order.products.find(p => 
          p && p.inventoryProduct && 
          p.inventoryProduct._id && 
          p.inventoryProduct._id.toString() === product._id.toString()
        );
        
        if (orderProduct) {
          overallStats.totalOrderedQuantity += orderProduct.quantity;
          overallStats.totalOrderValue += orderProduct.totalPrice;
        }
      });

      overallStats.totalStock += product.stock_amount;
      overallStats.totalStockValue += (product.stock_amount * product.price);
    }

    overallStats.totalOrders = orders.length;

    res.json({
      message: "Cumulative stock statistics retrieved successfully",
      stats: overallStats
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
    const company = await Company.findById(mongoose.Types.ObjectId.createFromHexString(companyId))
      .populate({
        path: 'inventory',
        populate: {
          path: 'products'
        }
      });

    if (!company || !company.inventory) {
      return res.status(404).json({
        message: "Company or inventory not found"
      });
    }

    const inventoryProducts = company.inventory.products || [];
    console.log('Found inventory products:', inventoryProducts.length);

    // Get all orders for the company
    const orders = await Order.find({
      company: mongoose.Types.ObjectId.createFromHexString(companyId)
    }).populate('products.inventoryProduct');

    // Initialize overall stats
    const overallStats = {
      totalProducts: inventoryProducts.length,
      totalStock: 0,
      totalStockValue: 0,
      totalOrders: 0,
      totalOrderedQuantity: 0,
      totalOrderValue: 0
    };

    // Process each product
    for (const product of inventoryProducts) {
      if (!product) continue;

      let productOrdered = 0;
      let productOrderValue = 0;

      // Calculate orders for this product
      orders.forEach(order => {
        if (!order || !order.products) return;
        
        const orderProduct = order.products.find(p => 
          p && p.inventoryProduct && 
          p.inventoryProduct._id && 
          p.inventoryProduct._id.toString() === product._id.toString()
        );
        
        if (orderProduct) {
          productOrdered += orderProduct.quantity;
          productOrderValue += orderProduct.totalPrice;
        }
      });

      overallStats.totalStock += product.stock_amount;
      overallStats.totalStockValue += (product.stock_amount * product.price);
      overallStats.totalOrderedQuantity += productOrdered;
      overallStats.totalOrderValue += productOrderValue;
    }

    overallStats.totalOrders = orders.length;

    res.json({
      message: "Product-wise stock statistics retrieved successfully",
      stats: overallStats
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
    const company = await Company.findById(mongoose.Types.ObjectId.createFromHexString(companyId))
      .populate({
        path: 'inventory',
        populate: {
          path: 'products'
        }
      });

    if (!company || !company.inventory) {
      return res.status(404).json({
        message: "Company or inventory not found"
      });
    }

    const inventoryProducts = company.inventory.products || [];
    console.log('Found inventory products:', inventoryProducts.length);

    // Get all orders for the company
    const orders = await Order.find({
      company: mongoose.Types.ObjectId.createFromHexString(companyId)
    }).populate('products.inventoryProduct');

    // Initialize stats
    const stats = {
      totalDesigns: 0,
      totalStock: 0,
      totalStockValue: 0,
      totalOrders: 0,
      totalOrderedQuantity: 0,
      totalOrderValue: 0
    };

    // Track unique design codes
    const uniqueDesigns = new Set();

    // Process each product
    for (const product of inventoryProducts) {
      if (!product) continue;

      const designCode = product.design_code || 'Unknown';
      uniqueDesigns.add(designCode);

      let productOrdered = 0;
      let productOrderValue = 0;

      // Calculate orders for this product
      orders.forEach(order => {
        if (!order || !order.products) return;
        
        const orderProduct = order.products.find(p => 
          p && p.inventoryProduct && 
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
      stats.totalStockValue += (product.stock_amount * product.price);
      stats.totalOrderedQuantity += productOrdered;
      stats.totalOrderValue += productOrderValue;
    }

    stats.totalDesigns = uniqueDesigns.size;
    stats.totalOrders = orders.length;

    res.json({
      message: "Design-wise stock statistics retrieved successfully",
      stats
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
  getDesignWiseStockStats
}; 