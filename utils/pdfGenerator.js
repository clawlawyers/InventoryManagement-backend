const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Get absolute paths
const rootDir = path.resolve(__dirname, "..");
const uploadsDir = path.join(rootDir, "uploads");
const invoicesDir = path.join(uploadsDir, "invoices");

console.log("📁 Directory paths:", {
  rootDir,
  uploadsDir,
  invoicesDir,
});

// Create uploads directory if it doesn't exist
try {
  if (!fs.existsSync(uploadsDir)) {
    console.log("📁 Creating uploads directory:", uploadsDir);
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Create invoices directory if it doesn't exist
  if (!fs.existsSync(invoicesDir)) {
    console.log("📁 Creating invoices directory:", invoicesDir);
    fs.mkdirSync(invoicesDir, { recursive: true });
  }
} catch (error) {
  console.error("❌ Error creating directories:", error);
  throw error;
}

const generateInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(
        `📄 Starting PDF generation for invoice ${invoice.invoiceNumber}`
      );

      // Validate required invoice data
      if (!invoice.invoiceNumber) {
        throw new Error("Invoice number is required");
      }

      // Generate unique filename
      const filename = `invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`;
      const filepath = path.join(invoicesDir, filename);

      console.log("📁 PDF file path:", {
        filename,
        filepath,
        exists: fs.existsSync(filepath),
      });

      // Create PDF document with error handling
      let doc;
      try {
        doc = new PDFDocument({
          size: "A4",
          margin: 50,
          bufferPages: true,
        });
        console.log("📄 PDF document created successfully");
      } catch (error) {
        console.error("❌ Error creating PDF document:", error);
        throw error;
      }

      // Create write stream with error handling
      let stream;
      try {
        stream = fs.createWriteStream(filepath);
        console.log("📄 Write stream created successfully");
      } catch (error) {
        console.error("❌ Error creating write stream:", error);
        throw error;
      }

      // Pipe PDF to file
      doc.pipe(stream);
      console.log("📄 PDF stream piped to file");

      // Add error handlers to stream
      stream.on("error", (error) => {
        console.error("❌ Stream error:", error);
        reject(error);
      });

      stream.on("finish", () => {
        console.log("✅ Stream finished successfully");
        resolve({
          filepath,
          filename,
        });
      });

      // Add error handler to doc
      doc.on("error", (error) => {
        console.error("❌ PDF document error:", error);
        reject(error);
      });

      // Add company details
      try {
        doc.fontSize(20).text("INVOICE", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Company: ${invoice.company.name}`);
        doc.text(`Address: ${invoice.company.address}`);
        doc.text(`GST Number: ${invoice.company.GSTNumber}`);
        doc.moveDown();
        console.log("✅ Company details added");
      } catch (error) {
        console.error("❌ Error adding company details:", error);
        throw error;
      }

      // Add client details
      try {
        doc.text(`Bill To:`);
        doc.text(`Name: ${invoice.clientDetails.name}`);
        doc.text(`Firm: ${invoice.clientDetails.firmName || "N/A"}`);
        doc.text(`Address: ${invoice.clientDetails.address}`);
        doc.text(`Phone: ${invoice.clientDetails.phone}`);
        doc.text(`GST Number: ${invoice.clientDetails.firmGSTNumber || "N/A"}`);
        doc.moveDown();
        console.log("✅ Client details added");
      } catch (error) {
        console.error("❌ Error adding client details:", error);
        throw error;
      }

      // Add invoice details
      try {
        doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
        doc.text(`Payment Method: ${invoice.paymentMethod || "N/A"}`);
        doc.text(`Payment Reference: ${invoice.paymentReference || "N/A"}`);
        doc.moveDown();
        console.log("✅ Invoice details added");
      } catch (error) {
        console.error("❌ Error adding invoice details:", error);
        throw error;
      }

      // Table headers
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = 100;
      const tableWidth = colWidth * 6;
      let y = tableTop; // Initialize y at the top of the table

      try {
        // Draw table header
        doc.fontSize(10);
        doc.text("Bail Number", tableLeft, y);
        doc.text("Design Code", tableLeft + colWidth, y);
        doc.text("Category", tableLeft + colWidth * 2, y);
        doc.text("Quantity", tableLeft + colWidth * 3, y);
        doc.text("Unit Price", tableLeft + colWidth * 4, y);
        doc.text("Total", tableLeft + colWidth * 5, y);

        // Draw header line with safe coordinates
        const headerLineY = Math.floor(y + 15);
        doc
          .moveTo(Math.floor(tableLeft), headerLineY)
          .lineTo(Math.floor(tableLeft + tableWidth), headerLineY)
          .stroke();

        doc.moveDown();
        y = Math.floor(doc.y); // Update y after moving down
        console.log("✅ Table header added");
      } catch (error) {
        console.error("❌ Error adding table header:", error);
        throw error;
      }

      // Table rows
      const productsForPDF =
        invoice.pdfProducts && invoice.pdfProducts.length > 0
          ? invoice.pdfProducts
          : invoice.products;
      console.log(
        "📦 Products for PDF:",
        JSON.stringify(productsForPDF, null, 2)
      );

      if (productsForPDF && productsForPDF.length > 0) {
        try {
          productsForPDF.forEach((product, index) => {
            if (y > 700) {
              // Check if we need a new page
              doc.addPage();
              y = 50;
            }

            console.log(
              `📦 Processing product ${index}:`,
              JSON.stringify(product, null, 2)
            );

            // Ensure numeric values
            const quantity = Number(product.quantity) || 0;
            const unitPrice = Number(product.unitPrice) || 0;
            const totalPrice = Number(product.totalPrice) || 0;

            console.log(`💰 Product ${index} values:`, {
              quantity,
              unitPrice,
              totalPrice,
              quantityType: typeof quantity,
              unitPriceType: typeof unitPrice,
              totalPriceType: typeof totalPrice,
            });

            // Draw row line with safe coordinates
            const rowLineY = Math.floor(y - 5);
            console.log(
              `📏 Drawing row line for product ${index} at Y: ${rowLineY}`
            );
            doc
              .moveTo(Math.floor(tableLeft), rowLineY)
              .lineTo(Math.floor(tableLeft + tableWidth), rowLineY)
              .stroke();

            console.log(`✍️ Drawing product ${index} text at Y: ${y}`);
            doc.text(product.bail_number || "N/A", tableLeft, y);
            doc.text(product.design_code || "N/A", tableLeft + colWidth, y);
            doc.text(
              product.category_code || "N/A",
              tableLeft + colWidth * 2,
              y
            );
            doc.text(quantity.toString(), tableLeft + colWidth * 3, y);
            doc.text(`₹${unitPrice.toFixed(2)}`, tableLeft + colWidth * 4, y);
            doc.text(`₹${totalPrice.toFixed(2)}`, tableLeft + colWidth * 5, y);

            y = Math.floor(y + 20);
          });

          // Draw final line with safe coordinates
          const finalLineY = Math.floor(y - 5);
          console.log(`📏 Drawing final table line at Y: ${finalLineY}`);
          doc
            .moveTo(Math.floor(tableLeft), finalLineY)
            .lineTo(Math.floor(tableLeft + tableWidth), finalLineY)
            .stroke();

          console.log("✅ Products table added");
        } catch (error) {
          console.error("❌ Error adding products table:", error);
          throw error;
        }
      } else {
        doc.text("No products in this invoice", tableLeft, y);
      }

      doc.moveDown(2);

      // Add totals
      try {
        doc.fontSize(12);
        console.log("💰 Invoice totals before formatting:", {
          subtotal: invoice.subtotal,
          taxRate: invoice.taxRate,
          taxAmount: invoice.taxAmount,
          totalAmount: invoice.totalAmount,
          paymentAmount: invoice.paymentAmount, // Log payment amount
        });

        const subtotal = Number(invoice.subtotal) || 0;
        const taxRate = Number(invoice.taxRate) || 0;
        const taxAmount = Number(invoice.taxAmount) || 0;
        const totalAmount = Number(invoice.totalAmount) || subtotal;
        const paymentAmount = Number(invoice.paymentAmount) || 0; // Get payment amount
        const remainingBalance = totalAmount - paymentAmount; // Calculate remaining balance

        console.log("💰 Invoice totals after formatting:", {
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          paymentAmount, // Log payment amount
          remainingBalance, // Log remaining balance
          subtotalType: typeof subtotal,
          taxRateType: typeof taxRate,
          taxAmountType: typeof taxAmount,
          totalAmountType: typeof totalAmount,
          paymentAmountType: typeof paymentAmount, // Log payment amount type
        });

        doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, { align: "right" });

        // Comment out Tax and original Total Amount as per user request
        // if (taxRate > 0) {
        //   doc.text(`Tax (${taxRate}%): ₹${taxAmount.toFixed(2)}`, { align: 'right' });
        // }
        // doc.fontSize(14).text(`Total Amount: ₹${totalAmount.toFixed(2)}`, { align: 'right' });

        doc.text(`Amount Paid: ₹${paymentAmount.toFixed(2)}`, {
          align: "right",
        });
        doc
          .fontSize(14)
          .text(`Remaining Balance: ₹${remainingBalance.toFixed(2)}`, {
            align: "right",
          });

        doc.moveDown();
        console.log("✅ Totals added");
      } catch (error) {
        console.error("❌ Error adding totals:", error);
        throw error;
      }

      // Add notes if any
      if (invoice.notes) {
        try {
          doc.fontSize(12).text("Notes:", { underline: true });
          doc.text(invoice.notes);
          doc.moveDown();
          console.log("✅ Notes added");
        } catch (error) {
          console.warn(
            "⚠️ Skipping notes section due to error:",
            error.message
          );
          // Continue without notes
        }
      }

      // Add terms
      try {
        doc
          .fontSize(10)
          .text(
            invoice.terms || "Payment received - Thank you for your business",
            { align: "center" }
          );
        console.log("✅ Terms added");
      } catch (error) {
        console.error("❌ Error adding terms:", error);
        throw error;
      }

      // Finalize PDF
      try {
        doc.end();
        console.log("✅ PDF finalized");
      } catch (error) {
        console.error("❌ Error finalizing PDF:", error);
        throw error;
      }
    } catch (error) {
      console.error(`❌ Error generating PDF: ${error.message}`);
      reject(error);
    }
  });
};

// Generate Order Invoice PDF
const generateOrderInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📄 Starting PDF generation for order ${order._id}`);

      // Validate required order data
      if (!order._id) {
        throw new Error("Order ID is required");
      }

      if (order.status !== "completed") {
        throw new Error("Order must be completed to generate invoice");
      }

      // Generate unique filename
      const filename = `order_invoice_${order._id}_${Date.now()}.pdf`;
      const filepath = path.join(invoicesDir, filename);

      console.log("📁 PDF file path:", {
        filename,
        filepath,
        exists: fs.existsSync(filepath),
      });

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      // Create write stream
      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Add error handlers
      stream.on("error", (error) => {
        console.error("❌ Stream error:", error);
        reject(error);
      });

      stream.on("finish", () => {
        console.log("✅ Stream finished successfully");
        resolve({
          filepath,
          filename,
        });
      });

      doc.on("error", (error) => {
        console.error("❌ PDF document error:", error);
        reject(error);
      });

      // Header
      doc.fontSize(20).text("ORDER INVOICE", { align: "center" });
      doc.moveDown();

      // Company details
      if (order.company) {
        doc.fontSize(14).text("FROM:", { underline: true });
        doc.fontSize(12).text(`Company: ${order.company.name || "N/A"}`);
        doc.text(`Address: ${order.company.address || "N/A"}`);
        if (order.company.GSTNumber) {
          doc.text(`GST Number: ${order.company.GSTNumber}`);
        }
        doc.moveDown();
      }

      // Client details
      if (order.client) {
        doc.fontSize(14).text("TO:", { underline: true });
        doc.fontSize(12).text(`Client: ${order.client.name || "N/A"}`);
        doc.text(`Phone: ${order.client.phone || "N/A"}`);
        if (order.client.firmName) {
          doc.text(`Firm: ${order.client.firmName}`);
        }
        if (order.client.firmGSTNumber) {
          doc.text(`GST Number: ${order.client.firmGSTNumber}`);
        }
        doc.text(`Address: ${order.client.address || "N/A"}`);
        doc.moveDown();
      }

      // Order details
      doc.fontSize(14).text("ORDER DETAILS:", { underline: true });
      doc.fontSize(12).text(`Order ID: ${order._id}`);
      doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Status: ${order.status.toUpperCase()}`);
      doc.moveDown();

      // Products table header
      doc.fontSize(14).text("PRODUCTS:", { underline: true });
      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const itemCodeX = 50;
      const descriptionX = 150;
      const quantityX = 350;
      const priceX = 420;
      const totalX = 490;

      doc.fontSize(10);
      doc.text("Item Code", itemCodeX, tableTop, { width: 90 });
      doc.text("Description", descriptionX, tableTop, { width: 180 });
      doc.text("Qty", quantityX, tableTop, { width: 50 });
      doc.text("Unit Price", priceX, tableTop, { width: 60 });
      doc.text("Total", totalX, tableTop, { width: 60 });

      // Draw line under headers
      doc
        .moveTo(itemCodeX, tableTop + 15)
        .lineTo(totalX + 60, tableTop + 15)
        .stroke();

      let currentY = tableTop + 25;

      // Products data
      if (order.products && order.products.length > 0) {
        order.products.forEach((product) => {
          const inventoryProduct = product.inventoryProduct;

          // Item code (design_code or bail_number)
          const itemCode =
            inventoryProduct?.design_code ||
            inventoryProduct?.bail_number ||
            "N/A";
          doc.text(itemCode, itemCodeX, currentY, { width: 90 });

          // Description (category_code + lot_number)
          const description = `${inventoryProduct?.category_code || "N/A"} - ${
            inventoryProduct?.lot_number || "N/A"
          }`;
          doc.text(description, descriptionX, currentY, { width: 180 });

          // Quantity
          doc.text(product.quantity.toString(), quantityX, currentY, {
            width: 50,
          });

          // Unit Price
          doc.text(`₹${product.unitPrice.toFixed(2)}`, priceX, currentY, {
            width: 60,
          });

          // Total Price
          doc.text(`₹${product.totalPrice.toFixed(2)}`, totalX, currentY, {
            width: 60,
          });

          currentY += 20;
        });
      }

      // Draw line before totals
      doc
        .moveTo(itemCodeX, currentY + 5)
        .lineTo(totalX + 60, currentY + 5)
        .stroke();

      currentY += 15;

      // Totals
      doc.fontSize(12);
      doc.text(
        `Total Amount: ₹${order.totalAmount.toFixed(2)}`,
        priceX,
        currentY,
        { width: 120 }
      );
      currentY += 20;

      if (order.paidAmount > 0) {
        doc.text(
          `Paid Amount: ₹${order.paidAmount.toFixed(2)}`,
          priceX,
          currentY,
          { width: 120 }
        );
        currentY += 20;
      }

      if (order.dueAmount > 0) {
        doc.text(
          `Due Amount: ₹${order.dueAmount.toFixed(2)}`,
          priceX,
          currentY,
          { width: 120 }
        );
        currentY += 20;
      }

      doc.text(
        `Payment Status: ${order.paymentStatus.toUpperCase()}`,
        priceX,
        currentY,
        { width: 120 }
      );

      // Footer
      doc.moveDown(2);
      doc
        .fontSize(10)
        .text("Thank you for your business!", { align: "center" });

      // Finalize PDF
      doc.end();
      console.log("✅ Order invoice PDF finalized");
    } catch (error) {
      console.error("❌ Error generating order invoice PDF:", error);
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateOrderInvoicePDF,
};
