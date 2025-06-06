const XLSX = require("xlsx");

// Generate CSV for inventory with all products
const generateInventoryCSV = (inventory, products) => {
  try {
    console.log(
      "📊 Starting CSV generation for inventory:",
      inventory.inventoryName
    );

    // Prepare data for CSV
    const csvData = products.map((product, index) => ({
      "S.No": index + 1,
      "Bail Number": product.bail_number || "N/A",
      "Design Code": product.design_code || "N/A",
      "Category Code": product.category_code || "N/A",
      "Lot Number": product.lot_number || "N/A",
      "Stock Amount": product.stock_amount || 0,
      "Price (₹)": product.price || 0,
      "Bail Date": product.bail_date
        ? new Date(product.bail_date).toLocaleDateString()
        : "N/A",
    }));

    // Add inventory summary at the top
    const summaryData = [
      {
        "S.No": "INVENTORY SUMMARY",
        "Bail Number": "",
        "Design Code": "",
        "Category Code": "",
        "Lot Number": "",
        "Stock Amount": "",
        "Price (₹)": "",
        "Bail Date": "",
      },
      {
        "S.No": "Inventory Name:",
        "Bail Number": inventory.inventoryName,
        "Design Code": "",
        "Category Code": "",
        "Lot Number": "",
        "Stock Amount": "",
        "Price (₹)": "",
        "Bail Date": "",
      },
      {
        "S.No": "Total Products:",
        "Bail Number": products.length,
        "Design Code": "",
        "Category Code": "",
        "Lot Number": "",
        "Stock Amount": "",
        "Price (₹)": "",
        "Bail Date": "",
      },
      {
        "S.No": "Generated On:",
        "Bail Number": new Date().toLocaleDateString(),
        "Design Code": "",
        "Category Code": "",
        "Lot Number": "",
        "Stock Amount": "",
        "Price (₹)": "",
        "Bail Date": "",
      },
      {
        "S.No": "",
        "Bail Number": "",
        "Design Code": "",
        "Category Code": "",
        "Lot Number": "",
        "Stock Amount": "",
        "Price (₹)": "",
        "Bail Date": "",
      },
      {
        "S.No": "PRODUCT DETAILS",
        "Bail Number": "",
        "Design Code": "",
        "Category Code": "",
        "Lot Number": "",
        "Stock Amount": "",
        "Price (₹)": "",
        "Bail Date": "",
      },
    ];

    // Combine summary and product data
    const finalData = [...summaryData, ...csvData];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(finalData);

    // Set column widths
    const columnWidths = [
      { wch: 8 }, // S.No
      { wch: 15 }, // Bail Number
      { wch: 15 }, // Design Code
      { wch: 15 }, // Category Code
      { wch: 15 }, // Lot Number
      { wch: 12 }, // Stock Amount
      { wch: 12 }, // Price
      { wch: 12 }, // Bail Date
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    // Generate CSV buffer
    const csvBuffer = XLSX.write(workbook, { type: "buffer", bookType: "csv" });

    console.log("✅ CSV generated successfully for inventory");
    return {
      buffer: csvBuffer,
      filename: `inventory_${inventory.inventoryName.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${Date.now()}.csv`,
      size: csvBuffer.length,
    };
  } catch (error) {
    console.error("❌ Error generating inventory CSV:", error);
    throw error;
  }
};

// Generate CSV for single product
const generateProductCSV = (product) => {
  try {
    console.log("📊 Starting CSV generation for product:", product.bail_number);

    // Prepare data for CSV
    const csvData = [
      {
        Field: "PRODUCT DETAILS",
        Value: "",
      },
      {
        Field: "Bail Number",
        Value: product.bail_number || "N/A",
      },
      {
        Field: "Design Code",
        Value: product.design_code || "N/A",
      },
      {
        Field: "Category Code",
        Value: product.category_code || "N/A",
      },
      {
        Field: "Lot Number",
        Value: product.lot_number || "N/A",
      },
      {
        Field: "Stock Amount",
        Value: product.stock_amount || 0,
      },
      {
        Field: "Price (₹)",
        Value: product.price || 0,
      },
      {
        Field: "Bail Date",
        Value: product.bail_date
          ? new Date(product.bail_date).toLocaleDateString()
          : "N/A",
      },
      {
        Field: "Generated On",
        Value: new Date().toLocaleDateString(),
      },
    ];

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(csvData);

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Field
      { wch: 30 }, // Value
    ];
    worksheet["!cols"] = columnWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Product");

    // Generate CSV buffer
    const csvBuffer = XLSX.write(workbook, { type: "buffer", bookType: "csv" });

    console.log("✅ CSV generated successfully for product");
    return {
      buffer: csvBuffer,
      filename: `product_${product.bail_number.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_${Date.now()}.csv`,
      size: csvBuffer.length,
    };
  } catch (error) {
    console.error("❌ Error generating product CSV:", error);
    throw error;
  }
};

module.exports = {
  generateInventoryCSV,
  generateProductCSV,
};
