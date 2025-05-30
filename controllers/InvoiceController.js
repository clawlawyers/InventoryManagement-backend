const Invoice = require("../models/Invoice");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Client = require("../models/Client");
const Company = require("../models/Company");
const InventoryProduct = require("../models/InventoryProduct");
const { generateInvoicePDF } = require("../utils/pdfGenerator");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// GET all invoices
const getAllInvoices = async (req, res) => {
  try {
    const { user, type } = req.user || { user: { _id: null }, type: "manager" };

    let query = {};

    // If salesman, only show invoices they created
    if (type === "salesman") {
      query.createdBy = user._id;
    }

    const invoices = await Invoice.find(query)
      .populate("client", "name phone firmName address")
      .populate("company", "name address GSTNumber")
      .populate("order", "totalAmount paidAmount status")
      .populate("payment", "amount paymentMethod paymentDate")
      .populate("createdBy", "name email phone")
      .sort({ createdAt: -1 });

    res.json({
      message: "Invoices retrieved successfully",
      invoices,
      count: invoices.length,
    });
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// GET invoice by ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type } = req.user || { user: { _id: null }, type: "manager" };

    const invoice = await Invoice.findById(id)
      .populate("client", "name phone firmName address")
      .populate("company", "name address GSTNumber")
      .populate("order", "totalAmount paidAmount status products")
      .populate("payment", "amount paymentMethod paymentDate paymentReference")
      .populate("createdBy", "name email phone")
      .populate({
        path: "products.inventoryProduct",
        select:
          "bail_number design_code category_code lot_number stock_amount price",
      });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check authorization for salesmen
    if (
      type === "salesman" &&
      invoice.createdBy._id.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: You can only view invoices you created",
      });
    }

    res.json({
      message: "Invoice retrieved successfully",
      invoice,
    });
  } catch (err) {
    console.error("Error fetching invoice:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Create invoice from payment (called automatically when payment is made)
const createInvoiceFromPayment = async (
  paymentId,
  orderData,
  clientData,
  companyData,
  creatorData
) => {
  try {
    console.log(`📝 Creating invoice for payment ${paymentId}`);

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Calculate proportional products based on payment amount
    const paymentRatio = payment.amount / orderData.totalAmount;
    console.log(`💰 Payment ratio: ${paymentRatio} (${payment.amount}/${orderData.totalAmount})`);

    const invoiceProducts = [];
    const pdfProducts = [];

    for (const orderProduct of orderData.products) {
      const proportionalQuantity = Math.ceil(
        orderProduct.quantity * paymentRatio
      );
      const proportionalPrice = orderProduct.totalPrice * paymentRatio;

      console.log(`📦 Product ${orderProduct.inventoryProduct}: Original Qty=${orderProduct.quantity}, New Qty=${proportionalQuantity}`);

      // Get inventory product details
      const inventoryProduct = await InventoryProduct.findById(
        orderProduct.inventoryProduct
      );

      if (!inventoryProduct) {
        console.warn(`⚠️ Inventory product ${orderProduct.inventoryProduct} not found`);
        continue;
      }

      // For saving in DB (matches schema)
      invoiceProducts.push({
        product: orderProduct.inventoryProduct,
        quantity: proportionalQuantity,
        unitPrice: orderProduct.unitPrice,
        totalPrice: proportionalPrice,
      });

      // For PDF generation (extra details)
      pdfProducts.push({
        bail_number: inventoryProduct.bail_number,
        design_code: inventoryProduct.design_code,
        category_code: inventoryProduct.category_code || "N/A",
        quantity: proportionalQuantity,
        unitPrice: orderProduct.unitPrice,
        totalPrice: proportionalPrice,
      });
    }

    if (invoiceProducts.length === 0) {
      throw new Error("No valid products found for invoice");
    }

    // Calculate financial details
    const subtotal = payment.amount;
    const taxRate = 0; // Can be configured later
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    console.log(`💵 Financial details - Subtotal: ${subtotal}, Tax: ${taxAmount}, Total: ${totalAmount}`);

    // Create client details snapshot
    const clientDetails = {
      name: clientData.name,
      phone: clientData.phone,
      firmName: clientData.firmName || "",
      firmGSTNumber: clientData.firmGSTNumber || "",
      email: clientData.email || "",
      address: clientData.address,
    };

    // Create the invoice
    const invoiceData = {
      order: orderData._id,
      payment: paymentId,
      client: clientData._id,
      company: companyData._id,
      clientDetails,
      products: invoiceProducts,
      subtotal,
      taxRate,
      taxAmount,
      totalAmount,
      paymentAmount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentDate: payment.paymentDate,
      paymentReference: payment.paymentReference || "",
      status: "paid",
      createdBy: creatorData._id,
      creatorType:
        creatorData.type === "manager" ? "Manager" : "SalesmanTextile",
      notes: payment.notes || "",
    };

    const invoice = new Invoice(invoiceData);
    await invoice.save();
    console.log(`✅ Invoice ${invoice.invoiceNumber} created successfully`);

    // Generate PDF for the invoice
    let updatedInvoice;
    try {
      console.log(`📄 Generating PDF for invoice ${invoice.invoiceNumber}`);
      const populatedInvoice = await Invoice.findById(invoice._id)
        .populate("company", "name address GSTNumber")
        .populate("client", "name phone firmName address email firmGSTNumber")
        .populate({
          path: "products.product",
          select: "bail_number design_code category_code lot_number stock_amount price"
        });
      if (!populatedInvoice) {
        throw new Error("Failed to populate invoice data");
      }

      // Attach pdfProducts for PDF generation
      populatedInvoice.pdfProducts = pdfProducts;

      const pdfResult = await generateInvoicePDF(populatedInvoice);
      await Invoice.findByIdAndUpdate(
        invoice._id,
        { pdfGenerated: true, pdfPath: pdfResult.filepath },
        { new: true }
      );
      updatedInvoice = await Invoice.findById(invoice._id);
      console.log('Invoice after update and fetch:', updatedInvoice);
    } catch (pdfError) {
      console.error("❌ Error generating PDF:", pdfError);
      updatedInvoice = await Invoice.findById(invoice._id);
      console.log('Invoice after failed PDF update:', updatedInvoice);
    }
    console.log('Invoice returned from createInvoiceFromPayment:', updatedInvoice);
    return updatedInvoice;
  } catch (error) {
    console.error("❌ Error creating invoice from payment:", error);
    throw error;
  }
};

// Update invoice status
const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { user, type } = req.user || { user: { _id: null }, type: "manager" };

    const validStatuses = ["draft", "sent", "paid", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check authorization for salesmen
    if (
      type === "salesman" &&
      invoice.createdBy.toString() !== user._id.toString()
    ) {
      return res.status(403).json({
        message: "Forbidden: You can only update invoices you created",
      });
    }

    invoice.status = status;
    await invoice.save();

    res.json({
      message: "Invoice status updated successfully",
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        updatedAt: invoice.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error updating invoice status:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// POST: Create a new invoice manually (for testing)
const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json({
      message: "Invoice created successfully",
      invoice,
    });
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(400).json({
      message: "Invoice creation failed",
      error: err.message,
    });
  }
};

// Download invoice PDF
const downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { user, type } = req.user || { user: { _id: null }, type: "manager" };

    console.log('🔍 Attempting to download PDF for invoice:', id);
    console.log('👤 User type:', type);

    // Fetch invoice with all required populated fields
    const invoice = await Invoice.findById(id)
      .populate("company", "name address GSTNumber")
      .populate("client", "name phone firmName address email firmGSTNumber")
      .populate({
        path: "products.product",
        select: "bail_number design_code category_code lot_number stock_amount price"
      })
      .populate("createdBy", "name email phone");

    console.log('📄 Found invoice:', {
      id: invoice?._id,
      invoiceNumber: invoice?.invoiceNumber,
      pdfGenerated: invoice?.pdfGenerated,
      pdfPath: invoice?.pdfPath,
      hasClient: !!invoice?.client,
      hasCompany: !!invoice?.company,
      hasProducts: invoice?.products?.length > 0
    });

    if (!invoice) {
      console.log('❌ Invoice not found');
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check authorization for salesmen
    if (
      type === "salesman" &&
      invoice.createdBy.toString() !== user._id.toString()
    ) {
      console.log('🚫 Unauthorized access attempt by salesman');
      return res.status(403).json({
        message: "Forbidden: You can only download invoices you created",
      });
    }

    // Prepare client details for PDF generation
    if (invoice.client) {
      invoice.clientDetails = {
        name: invoice.client.name,
        phone: invoice.client.phone,
        firmName: invoice.client.firmName || "",
        firmGSTNumber: invoice.client.firmGSTNumber || "",
        email: invoice.client.email || "",
        address: invoice.client.address
      };
    }

    // Prepare products for PDF generation
    if (invoice.products && invoice.products.length > 0) {
      console.log('📦 Original products:', JSON.stringify(invoice.products, null, 2));
      
      invoice.pdfProducts = invoice.products.map(product => {
        // Log the product structure for debugging
        console.log('📦 Processing product:', JSON.stringify(product, null, 2));
        
        // Handle both populated and unpopulated product structures
        const productData = product.product || product;
        console.log('📦 Product data:', JSON.stringify(productData, null, 2));
        
        // Ensure numeric values are valid numbers
        const rawQuantity = product.quantity;
        const rawUnitPrice = product.unitPrice;
        const rawTotalPrice = product.totalPrice;
        
        console.log('💰 Raw values:', {
          rawQuantity,
          rawUnitPrice,
          rawTotalPrice,
          rawQuantityType: typeof rawQuantity,
          rawUnitPriceType: typeof rawUnitPrice,
          rawTotalPriceType: typeof rawTotalPrice
        });

        const quantity = Number(rawQuantity);
        const unitPrice = Number(rawUnitPrice);
        const totalPrice = Number(rawTotalPrice);

        console.log('💰 Converted values:', {
          quantity,
          unitPrice,
          totalPrice,
          quantityType: typeof quantity,
          unitPriceType: typeof unitPrice,
          totalPriceType: typeof totalPrice
        });

        // Validate numbers
        if (isNaN(quantity) || isNaN(unitPrice) || isNaN(totalPrice)) {
          console.warn('⚠️ Invalid number detected:', {
            quantity: isNaN(quantity),
            unitPrice: isNaN(unitPrice),
            totalPrice: isNaN(totalPrice)
          });
        }
        
        return {
          bail_number: productData.bail_number || 'N/A',
          design_code: productData.design_code || 'N/A',
          category_code: productData.category_code || 'N/A',
          quantity: isNaN(quantity) ? 0 : quantity,
          unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
          totalPrice: isNaN(totalPrice) ? 0 : totalPrice
        };
      });

      console.log('📦 Final PDF products:', JSON.stringify(invoice.pdfProducts, null, 2));
    }

    // Ensure numeric values for invoice totals
    console.log('💰 Original invoice totals:', {
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount
    });

    const rawSubtotal = invoice.subtotal;
    const rawTaxRate = invoice.taxRate;
    const rawTaxAmount = invoice.taxAmount;
    const rawTotalAmount = invoice.totalAmount;

    console.log('💰 Raw invoice values:', {
      rawSubtotal,
      rawTaxRate,
      rawTaxAmount,
      rawTotalAmount,
      rawSubtotalType: typeof rawSubtotal,
      rawTaxRateType: typeof rawTaxRate,
      rawTaxAmountType: typeof rawTaxAmount,
      rawTotalAmountType: typeof rawTotalAmount
    });

    invoice.subtotal = Number(rawSubtotal);
    invoice.taxRate = Number(rawTaxRate);
    invoice.taxAmount = Number(rawTaxAmount);
    invoice.totalAmount = Number(rawTotalAmount);

    console.log('💰 Converted invoice values:', {
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      subtotalType: typeof invoice.subtotal,
      taxRateType: typeof invoice.taxRate,
      taxAmountType: typeof invoice.taxAmount,
      totalAmountType: typeof invoice.totalAmount
    });

    // Validate numbers
    if (isNaN(invoice.subtotal) || isNaN(invoice.taxRate) || isNaN(invoice.taxAmount) || isNaN(invoice.totalAmount)) {
      console.warn('⚠️ Invalid invoice numbers detected:', {
        subtotal: isNaN(invoice.subtotal),
        taxRate: isNaN(invoice.taxRate),
        taxAmount: isNaN(invoice.taxAmount),
        totalAmount: isNaN(invoice.totalAmount)
      });
    }

    // Set fallback values for NaN
    invoice.subtotal = isNaN(invoice.subtotal) ? 0 : invoice.subtotal;
    invoice.taxRate = isNaN(invoice.taxRate) ? 0 : invoice.taxRate;
    invoice.taxAmount = isNaN(invoice.taxAmount) ? 0 : invoice.taxAmount;
    invoice.totalAmount = isNaN(invoice.totalAmount) ? invoice.subtotal : invoice.totalAmount;

    if (!invoice.pdfGenerated || !invoice.pdfPath) {
      console.log('❌ PDF not generated or path missing:', {
        pdfGenerated: invoice.pdfGenerated,
        pdfPath: invoice.pdfPath
      });
      
      // Try to regenerate the PDF if it's missing
      try {
        console.log('🔄 Attempting to regenerate PDF...');
        const pdfResult = await generateInvoicePDF(invoice);
        await Invoice.findByIdAndUpdate(
          invoice._id,
          { pdfGenerated: true, pdfPath: pdfResult.filepath },
          { new: true }
        );
        
        // Update invoice with new path
        invoice.pdfPath = pdfResult.filepath;
        invoice.pdfGenerated = true;
        console.log('✅ PDF regenerated successfully');
      } catch (regenerateError) {
        console.error('❌ Failed to regenerate PDF:', regenerateError);
        return res.status(500).json({ 
          message: "PDF generation failed",
          error: regenerateError.message 
        });
      }
    }

    // Resolve absolute path
    const absolutePath = path.resolve(invoice.pdfPath);
    console.log('📁 Checking PDF file at:', absolutePath);

    // Check if file exists
    if (!fs.existsSync(absolutePath)) {
      console.log('❌ PDF file not found at path:', absolutePath);
      return res.status(404).json({ message: "PDF file not found" });
    }

    console.log('✅ PDF found, preparing to stream file');
    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${invoice.invoiceNumber}.pdf`);

    // Stream the PDF file
    const fileStream = fs.createReadStream(absolutePath);
    
    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('❌ Error streaming PDF:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          message: "Error streaming PDF file",
          error: error.message 
        });
      }
    });

    fileStream.pipe(res);
    console.log('📤 PDF streaming started');

  } catch (err) {
    console.error("❌ Error downloading invoice PDF:", err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Manually generate PDF for a payment
const generatePDFForPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { user, type } = req.user || { user: { _id: null }, type: "manager" };

    // Get payment details
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Get order details
    const order = await Order.findById(payment.order).populate({
      path: "products.inventoryProduct",
      select: "bail_number design_code category_code lot_number stock_amount price",
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Get company details
    const company = await Company.findById(order.company);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Create invoice from payment
    const invoice = await createInvoiceFromPayment(
      paymentId,
      order,
      order.client,
      company,
      { _id: user._id, type }
    );

    res.json({
      message: "PDF generated successfully",
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        status: invoice.status,
        pdfGenerated: invoice.pdfGenerated,
        pdfPath: invoice.pdfPath
      }
    });
  } catch (err) {
    console.error("Error generating PDF for payment:", err);
    res.status(500).json({
      message: "Failed to generate PDF",
      error: err.message
    });
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  createInvoiceFromPayment,
  updateInvoiceStatus,
  downloadInvoicePDF,
  generatePDFForPayment
};
