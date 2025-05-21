const xlsx = require("xlsx");
const Inventory = require("../models/Inventory");
const Company = require("../models/Company");
const InventoryProduct = require("../models/InventoryProduct");
const ExcelUpload = require("../models/ExcelUpload");

// Upload and process inventory Excel file
const uploadInventoryExcel = async (req, res) => {
  try {
    // Direct console.log for debugging
    console.log("=============================================");
    console.log("EXCEL UPLOAD ENDPOINT CALLED");
    console.log("Request params:", req.params);
    console.log("Request method:", req.method);
    console.log("Request URL:", req.originalUrl);
    console.log("Request headers:", req.headers);

    const companyId = req.params.companyId;
    console.log("Looking for company with ID:", companyId);
    console.log("Company ID type:", typeof companyId);

    // Check if company exists
    const company = await Company.findById(companyId);
    console.log("Company search result:", company ? "Found" : "Not found");

    if (!company) {
      // Try listing all companies to debug
      const allCompanies = await Company.find({});
      console.log(
        "All companies:",
        allCompanies.map((c) => c._id.toString())
      );

      return res.status(404).json({
        message: "Company not found",
        requestedId: companyId,
        availableIds: allCompanies.map((c) => c._id.toString()),
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Process the Excel file directly from buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Get column headers from the first row
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    // Check if this is just a headers request (first step of the process)
    const isHeadersRequest = req.body.headersOnly === "true";

    if (isHeadersRequest) {
      return res.status(200).json({
        message: "Excel file headers retrieved successfully",
        headers: headers,
      });
    }

    // Get column mappings from request body
    const columnMappings = JSON.parse(req.body.columnMappings || "{}");

    console.log("Column mappings:", columnMappings);

    // Define required and optional fields
    const requiredFields = [
      "baleNumberField", // At minimum, we need a bale number or identifier
    ];

    // These fields are preferred but can be handled with defaults if missing
    const optionalFields = [
      "dateField",
      "categoryField",
      "lotNumberField",
      "stockAmountField",
    ];

    // Try to automatically map columns based on common names if no mappings provided
    if (Object.keys(columnMappings).length === 0) {
      console.log("No column mappings provided, trying to auto-map columns");

      // Directly map to the specific column names from the Excel file
      if (headers.includes("Full Bale No.")) {
        columnMappings.baleNumberField = "Full Bale No.";
        console.log(`Auto-mapped baleNumberField to Full Bale No.`);
      }

      if (headers.includes("Entry Date")) {
        columnMappings.dateField = "Entry Date";
        console.log(`Auto-mapped dateField to Entry Date`);
      }

      if (headers.includes("Item Name")) {
        columnMappings.categoryField = "Item Name";
        console.log(`Auto-mapped categoryField to Item Name`);
      }

      if (headers.includes("Lot No")) {
        columnMappings.lotNumberField = "Lot No";
        console.log(`Auto-mapped lotNumberField to Lot No`);
      } else if (headers.includes("Design No")) {
        columnMappings.lotNumberField = "Design No";
        console.log(`Auto-mapped lotNumberField to Design No`);
      }

      if (headers.includes("Stock Act Mt")) {
        columnMappings.stockAmountField = "Stock Act Mt";
        console.log(`Auto-mapped stockAmountField to Stock Act Mt`);
      }
    }

    // Check for required fields
    const missingRequiredFields = requiredFields.filter(
      (field) => !columnMappings[field]
    );

    if (missingRequiredFields.length > 0) {
      // If "Full Bale No." is in the headers but not mapped, auto-map it
      if (
        missingRequiredFields.includes("baleNumberField") &&
        headers.includes("Full Bale No.")
      ) {
        columnMappings.baleNumberField = "Full Bale No.";
        console.log(
          `Auto-mapped missing required field baleNumberField to Full Bale No.`
        );
      } else {
        return res.status(400).json({
          message: "Missing required column mappings",
          missingFields: missingRequiredFields,
          availableHeaders: headers,
          suggestedMappings: {
            baleNumberField: "Full Bale No.",
            dateField: "Entry Date",
            categoryField: "Item Name",
            lotNumberField: "Lot No",
            stockAmountField: "Stock Act Mt",
          },
          note: "Only baleNumberField is required. Other fields can be null if not provided.",
        });
      }
    }

    // Log which optional fields are missing
    const missingOptionalFields = optionalFields.filter(
      (field) => !columnMappings[field]
    );

    if (missingOptionalFields.length > 0) {
      console.log("Missing optional fields:", missingOptionalFields);
      console.log("These fields will use default values");
    }

    // Process data (create inventory items from Excel data)
    const processingResults = {
      success: 0,
      errors: 0,
      details: [],
      headers: headers,
    };

    // Get inventory name from request body or use default
    const inventoryName =
      req.body.inventoryName ||
      `Inventory-${new Date().toISOString().split("T")[0]}`;

    // Create a new inventory document
    const inventoryDoc = new Inventory({
      inventoryName: inventoryName,
      company: companyId,
      products: [],
    });

    await inventoryDoc.save();

    // Set inventory for company
    company.inventory = inventoryDoc._id;
    await company.save();

    // Process each row in the Excel file
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Get values using the user-defined column mappings
        const baleNumberField = columnMappings.baleNumberField;
        const dateField = columnMappings.dateField || null;
        const categoryField = columnMappings.categoryField || null;
        const lotNumberField = columnMappings.lotNumberField || null;
        const stockAmountField = columnMappings.stockAmountField || null;

        // Get values from the row, with fallbacks for missing values
        const bailNumber = row[baleNumberField] || "";

        // Handle missing mappings or values with defaults
        const bailDate =
          dateField && row[dateField] ? new Date(row[dateField]) : new Date();

        const categoryCode =
          categoryField && row[categoryField] ? row[categoryField] : "";

        // For lot_number, try both Lot No and Design No if available
        let lotNumber = "";
        if (lotNumberField && row[lotNumberField]) {
          lotNumber = row[lotNumberField];
        } else if (headers.includes("Design No") && row["Design No"]) {
          lotNumber = row["Design No"];
        } else if (headers.includes("Lot No") && row["Lot No"]) {
          lotNumber = row["Lot No"];
        }

        const stockAmount =
          stockAmountField && row[stockAmountField]
            ? parseFloat(row[stockAmountField])
            : 0;

        // Check if we have the minimum required data (bale number)
        if (!bailNumber) {
          throw new Error(`Missing bale number in row ${i + 1}`);
        }

        // Create new inventory product with fallback values for missing data
        const inventoryProduct = new InventoryProduct({
          bail_number: bailNumber,
          bail_date: bailDate,
          category_code: categoryCode,
          lot_number: lotNumber,
          stock_amount: stockAmount,
        });

        await inventoryProduct.save();

        // Add product to inventory's products array
        inventoryDoc.products.push(inventoryProduct._id);

        processingResults.success++;
        processingResults.details.push({
          row: i + 1,
          message: "Product added to inventory successfully",
          success: true,
        });
      } catch (error) {
        processingResults.errors++;
        processingResults.details.push({
          row: i + 1,
          message: error.message,
          success: false,
        });
      }
    }

    // Save the inventory with all products
    await inventoryDoc.save();

    // Create an ExcelUpload record to track this upload
    const excelUpload = new ExcelUpload({
      filename: req.file.originalname,
      originalname: req.file.originalname,
      path: req.file.path || "memory-storage", // Since we're using memory storage
      size: req.file.size,
      processed: true,
      processingResults: {
        success: processingResults.success,
        errors: processingResults.errors,
        details: processingResults.details,
      },
    });

    await excelUpload.save();

    res.status(200).json({
      message: "Inventory Excel file processed successfully",
      file: {
        originalname: req.file.originalname,
      },
      inventory: {
        id: inventoryDoc._id,
        name: inventoryDoc.inventoryName,
        productCount: processingResults.success,
      },
      columnMappings: columnMappings,
      missingOptionalFields: missingOptionalFields || [],
      results: processingResults,
      uploadId: excelUpload._id,
    });
  } catch (err) {
    console.error("Error processing Excel file:", err);
    res.status(500).json({
      message: "Error processing Excel file",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

module.exports = {
  uploadInventoryExcel,
};
