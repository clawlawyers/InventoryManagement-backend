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

// Generate Order Invoice PDF in memory (no file storage)
const generateOrderInvoicePDF = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(
        `📄 Starting in-memory PDF generation for order ${order._id}`
      );

      // Validate required order data
      if (!order._id) {
        throw new Error("Order ID is required");
      }

      if (order.status !== "completed") {
        throw new Error("Order must be completed to generate invoice");
      }

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      // Register a font that supports rupee symbol (optional)
      // doc.registerFont('DejaVu', 'path/to/DejaVuSans.ttf');
      // doc.font('DejaVu');

      // Collect PDF data in memory
      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        console.log("✅ PDF generated successfully in memory");
        const pdfBuffer = Buffer.concat(chunks);
        resolve({
          buffer: pdfBuffer,
          filename: `order_invoice_${order._id}_${Date.now()}.pdf`,
          size: pdfBuffer.length,
        });
      });

      doc.on("error", (error) => {
        console.error("❌ PDF document error:", error);
        reject(error);
      });

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("ORDER INVOICE", { align: "center" });
      doc.moveDown(2); // More space after header

      // Company details
      if (order.company) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("FROM:", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Company: ${order.company.name || "N/A"}`, { lineGap: 4 });
        doc.text(`Address: ${order.company.address || "N/A"}`, { lineGap: 4 });
        if (order.company.GSTNumber) {
          doc.text(`GST Number: ${order.company.GSTNumber}`, { lineGap: 4 });
        }
        doc.moveDown(1.5);
      }

      // Client details
      if (order.client) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("TO:", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Client: ${order.client.name || "N/A"}`, { lineGap: 4 });
        doc.text(`Phone: ${order.client.phone || "N/A"}`, { lineGap: 4 });
        if (order.client.firmName) {
          doc.text(`Firm: ${order.client.firmName}`, { lineGap: 4 });
        }
        if (order.client.firmGSTNumber) {
          doc.text(`GST Number: ${order.client.firmGSTNumber}`, { lineGap: 4 });
        }
        doc.text(`Address: ${order.client.address || "N/A"}`, { lineGap: 4 });
        doc.moveDown(1.5);
      }

      // Order details
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("ORDER DETAILS:", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica");
      doc.text(`Order ID: ${order._id}`, { lineGap: 4 });
      doc.text(
        `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
        { lineGap: 4 }
      );
      doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, {
        lineGap: 4,
      });
      doc.text(`Status: ${order.status.toUpperCase()}`, { lineGap: 4 });
      doc.moveDown(2);

      // Products table header
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PRODUCTS:", { underline: true });
      doc.moveDown(1);

      // Table headers
      const tableTop = doc.y;
      const itemCodeX = 50;
      const descriptionX = 150;
      const quantityX = 350;
      const priceX = 420;
      const totalX = 490;

      doc.fontSize(11).font("Helvetica-Bold");
      doc.text("Item Code", itemCodeX, tableTop, { width: 90, lineGap: 2 });
      doc.text("Description", descriptionX, tableTop, {
        width: 180,
        lineGap: 2,
      });
      doc.text("Qty", quantityX, tableTop, { width: 50, lineGap: 2 });
      doc.text("Unit Price", priceX, tableTop, { width: 60, lineGap: 2 });
      doc.text("Total", totalX, tableTop, { width: 60, lineGap: 2 });

      // Draw line under headers
      doc
        .moveTo(itemCodeX, tableTop + 22)
        .lineTo(totalX + 60, tableTop + 22)
        .stroke();

      let currentY = tableTop + 35;

      // Products data
      if (order.products && order.products.length > 0) {
        doc.fontSize(10).font("Helvetica"); // Set font for product rows

        order.products.forEach((product) => {
          const inventoryProduct = product.inventoryProduct;

          // Item code (design_code or bail_number)
          const itemCode =
            inventoryProduct?.design_code ||
            inventoryProduct?.bail_number ||
            "N/A";
          doc.text(itemCode, itemCodeX, currentY, { width: 90, lineGap: 3 });

          // Description (category_code + lot_number)
          const description = `${inventoryProduct?.category_code || "N/A"} - ${
            inventoryProduct?.lot_number || "N/A"
          }`;
          doc.text(description, descriptionX, currentY, {
            width: 180,
            lineGap: 3,
          });

          // Quantity
          doc.text(product.quantity.toString(), quantityX, currentY, {
            width: 50,
            lineGap: 3,
          });

          // Unit Price
          doc.text(`Rs. ${product.unitPrice.toFixed(2)}`, priceX, currentY, {
            width: 60,
            lineGap: 3,
          });

          // Total Price
          doc.text(`Rs. ${product.totalPrice.toFixed(2)}`, totalX, currentY, {
            width: 60,
            lineGap: 3,
          });

          currentY += 30; // Even more spacing between product rows
        });
      }

      // Draw line before totals
      doc
        .moveTo(itemCodeX, currentY + 5)
        .lineTo(totalX + 60, currentY + 5)
        .stroke();

      currentY += 15;

      // Totals section with better spacing
      currentY += 20; // More space before totals
      doc.fontSize(12);

      // Total Amount (bold and larger)
      doc.fontSize(14).font("Helvetica-Bold");
      doc.text(
        `Total Amount: Rs. ${order.totalAmount.toFixed(2)}`,
        priceX,
        currentY,
        { width: 250, lineGap: 5 }
      );
      currentY += 30; // More spacing after total amount

      // Reset to normal font
      doc.fontSize(12).font("Helvetica");

      if (order.paidAmount > 0) {
        doc.text(
          `Paid Amount: Rs. ${order.paidAmount.toFixed(2)}`,
          priceX,
          currentY,
          { width: 150, lineGap: 4 }
        );
        currentY += 28; // Increased spacing
      }

      if (order.dueAmount > 0) {
        doc.text(
          `Due Amount: Rs. ${order.dueAmount.toFixed(2)}`,
          priceX,
          currentY,
          { width: 150, lineGap: 4 }
        );
        currentY += 28; // Increased spacing
      }

      // Payment Status with some emphasis
      doc.fontSize(11).font("Helvetica-Bold");
      doc.text(
        `Payment Status: ${order.paymentStatus.toUpperCase()}`,
        priceX,
        currentY,
        { width: 150, lineGap: 4 }
      );

      // Footer with better spacing
      currentY += 40; // More space before footer
      doc.fontSize(10).font("Helvetica");
      doc.text("Thank you for your business!", 50, currentY, {
        align: "center",
        width: 500,
        lineGap: 5,
      });

      // Finalize PDF
      doc.end();
      console.log("✅ Order invoice PDF finalized");
    } catch (error) {
      console.error("❌ Error generating order invoice PDF:", error);
      reject(error);
    }
  });
};

// Generate PDF for inventory with all products
const generateInventoryPDF = async (inventory, products, company) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(
        `📄 Starting PDF generation for inventory ${inventory.inventoryName}`
      );

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      // Collect PDF data in memory
      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        console.log("✅ Inventory PDF generated successfully in memory");
        const pdfBuffer = Buffer.concat(chunks);
        resolve({
          buffer: pdfBuffer,
          filename: `inventory_${inventory.inventoryName.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}_${Date.now()}.pdf`,
          size: pdfBuffer.length,
        });
      });

      doc.on("error", (error) => {
        console.error("❌ PDF document error:", error);
        reject(error);
      });

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("INVENTORY REPORT", { align: "center" });
      doc.moveDown(2);

      // Company details
      if (company) {
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("COMPANY DETAILS:", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12).font("Helvetica");
        doc.text(`Company: ${company.name || "N/A"}`, { lineGap: 4 });
        doc.text(`Address: ${company.address || "N/A"}`, { lineGap: 4 });
        if (company.GSTNumber) {
          doc.text(`GST Number: ${company.GSTNumber}`, { lineGap: 4 });
        }
        doc.moveDown(1.5);
      }

      // Inventory details
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("INVENTORY DETAILS:", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).font("Helvetica");
      doc.text(`Inventory Name: ${inventory.inventoryName}`, { lineGap: 4 });
      doc.text(`Total Products: ${products.length}`, { lineGap: 4 });
      doc.text(`Generated On: ${new Date().toLocaleDateString()}`, {
        lineGap: 4,
      });
      doc.moveDown(2);

      // Products table header
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("PRODUCTS:", { underline: true });
      doc.moveDown(1);

      // Table headers
      const tableTop = doc.y;
      const bailNumberX = 50;
      const designCodeX = 130;
      const categoryX = 210;
      const lotNumberX = 290;
      const stockX = 370;
      const priceX = 430;
      const dateX = 490;

      doc.fontSize(10).font("Helvetica-Bold");
      doc.text("Bail No.", bailNumberX, tableTop, { width: 70, lineGap: 2 });
      doc.text("Design", designCodeX, tableTop, { width: 70, lineGap: 2 });
      doc.text("Category", categoryX, tableTop, { width: 70, lineGap: 2 });
      doc.text("Lot No.", lotNumberX, tableTop, { width: 70, lineGap: 2 });
      doc.text("Stock", stockX, tableTop, { width: 50, lineGap: 2 });
      doc.text("Price", priceX, tableTop, { width: 50, lineGap: 2 });
      doc.text("Date", dateX, tableTop, { width: 60, lineGap: 2 });

      // Draw line under headers
      doc
        .moveTo(bailNumberX, tableTop + 22)
        .lineTo(dateX + 60, tableTop + 22)
        .stroke();

      let currentY = tableTop + 35;

      // Products data
      if (products && products.length > 0) {
        doc.fontSize(9).font("Helvetica");

        products.forEach((product, index) => {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;

            // Redraw headers on new page
            doc.fontSize(10).font("Helvetica-Bold");
            doc.text("Bail No.", bailNumberX, currentY, {
              width: 70,
              lineGap: 2,
            });
            doc.text("Design", designCodeX, currentY, {
              width: 70,
              lineGap: 2,
            });
            doc.text("Category", categoryX, currentY, {
              width: 70,
              lineGap: 2,
            });
            doc.text("Lot No.", lotNumberX, currentY, {
              width: 70,
              lineGap: 2,
            });
            doc.text("Stock", stockX, currentY, { width: 50, lineGap: 2 });
            doc.text("Price", priceX, currentY, { width: 50, lineGap: 2 });
            doc.text("Date", dateX, currentY, { width: 60, lineGap: 2 });

            doc
              .moveTo(bailNumberX, currentY + 22)
              .lineTo(dateX + 60, currentY + 22)
              .stroke();

            currentY += 35;
            doc.fontSize(9).font("Helvetica");
          }

          // Bail Number
          doc.text(product.bail_number || "N/A", bailNumberX, currentY, {
            width: 70,
            lineGap: 3,
          });

          // Design Code
          doc.text(product.design_code || "N/A", designCodeX, currentY, {
            width: 70,
            lineGap: 3,
          });

          // Category Code
          doc.text(product.category_code || "N/A", categoryX, currentY, {
            width: 70,
            lineGap: 3,
          });

          // Lot Number
          doc.text(product.lot_number || "N/A", lotNumberX, currentY, {
            width: 70,
            lineGap: 3,
          });

          // Stock Amount
          doc.text((product.stock_amount || 0).toString(), stockX, currentY, {
            width: 50,
            lineGap: 3,
          });

          // Price
          doc.text(`₹${(product.price || 0).toFixed(2)}`, priceX, currentY, {
            width: 50,
            lineGap: 3,
          });

          // Date
          doc.text(
            product.bail_date
              ? new Date(product.bail_date).toLocaleDateString()
              : "N/A",
            dateX,
            currentY,
            { width: 60, lineGap: 3 }
          );

          currentY += 25;
        });
      } else {
        doc.text("No products found in this inventory", bailNumberX, currentY);
      }

      // Summary section
      currentY += 30;
      doc.fontSize(12).font("Helvetica-Bold");
      doc.text("SUMMARY:", 50, currentY);
      currentY += 20;

      doc.fontSize(11).font("Helvetica");
      const totalStock = products.reduce(
        (sum, product) => sum + (product.stock_amount || 0),
        0
      );
      const totalValue = products.reduce(
        (sum, product) =>
          sum + (product.price || 0) * (product.stock_amount || 0),
        0
      );

      doc.text(`Total Products: ${products.length}`, 50, currentY);
      currentY += 15;
      doc.text(`Total Stock: ${totalStock}`, 50, currentY);
      currentY += 15;
      doc.text(
        `Total Inventory Value: ₹${totalValue.toFixed(2)}`,
        50,
        currentY
      );

      // Footer
      currentY += 40;
      doc.fontSize(10).font("Helvetica");
      doc.text("Generated by Inventory Management System", 50, currentY, {
        align: "center",
        width: 500,
        lineGap: 5,
      });

      // Finalize PDF
      doc.end();
      console.log("✅ Inventory PDF finalized");
    } catch (error) {
      console.error("❌ Error generating inventory PDF:", error);
      reject(error);
    }
  });
};

// Generate PDF for single product
const generateProductPDF = async (product) => {
  return new Promise((resolve, reject) => {
    try {
      console.log(
        `📄 Starting PDF generation for product ${product.bail_number}`
      );

      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      });

      // Collect PDF data in memory
      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        console.log("✅ Product PDF generated successfully in memory");
        const pdfBuffer = Buffer.concat(chunks);
        resolve({
          buffer: pdfBuffer,
          filename: `product_${product.bail_number.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          )}_${Date.now()}.pdf`,
          size: pdfBuffer.length,
        });
      });

      doc.on("error", (error) => {
        console.error("❌ PDF document error:", error);
        reject(error);
      });

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("PRODUCT DETAILS", { align: "center" });
      doc.moveDown(3);

      // Product details in a structured format
      const details = [
        { label: "Bail Number:", value: product.bail_number || "N/A" },
        { label: "Design Code:", value: product.design_code || "N/A" },
        { label: "Category Code:", value: product.category_code || "N/A" },
        { label: "Lot Number:", value: product.lot_number || "N/A" },
        {
          label: "Stock Amount:",
          value: (product.stock_amount || 0).toString(),
        },
        { label: "Price:", value: `₹${(product.price || 0).toFixed(2)}` },
        {
          label: "Bail Date:",
          value: product.bail_date
            ? new Date(product.bail_date).toLocaleDateString()
            : "N/A",
        },
        {
          label: "Total Value:",
          value: `₹${(
            (product.price || 0) * (product.stock_amount || 0)
          ).toFixed(2)}`,
        },
      ];

      // Draw product details
      let currentY = doc.y;
      doc.fontSize(14).font("Helvetica-Bold");

      details.forEach((detail) => {
        // Label
        doc.text(detail.label, 50, currentY, { width: 150 });

        // Value
        doc.font("Helvetica").text(detail.value, 220, currentY, { width: 300 });

        currentY += 30;
        doc.font("Helvetica-Bold");
      });

      // Add some spacing
      currentY += 20;

      // Additional information section
      doc.fontSize(16).font("Helvetica-Bold");
      doc.text("ADDITIONAL INFORMATION", 50, currentY);
      currentY += 30;

      doc.fontSize(12).font("Helvetica");
      doc.text(
        `Generated On: ${new Date().toLocaleDateString()}`,
        50,
        currentY
      );
      currentY += 20;
      doc.text(
        `Generated At: ${new Date().toLocaleTimeString()}`,
        50,
        currentY
      );

      // Footer
      currentY += 60;
      doc.fontSize(10).font("Helvetica");
      doc.text("Generated by Inventory Management System", 50, currentY, {
        align: "center",
        width: 500,
        lineGap: 5,
      });

      // Finalize PDF
      doc.end();
      console.log("✅ Product PDF finalized");
    } catch (error) {
      console.error("❌ Error generating product PDF:", error);
      reject(error);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateOrderInvoicePDF,
  generateInventoryPDF,
  generateProductPDF,
};
