const xlsx = require("xlsx");
const Inventory = require("../models/Inventory");
const Company = require("../models/Company");
const InventoryProduct = require("../models/InventoryProduct");
const ExcelUpload = require("../models/ExcelUpload");

// Upload Excel file and extract headers only
const uploadInventoryExcel = async (req, res) => {
  try {
    console.log("=============================================");
    console.log("EXCEL UPLOAD ENDPOINT CALLED");
    console.log("Request params:", req.params);
    console.log("Request method:", req.method);
    console.log("Request URL:", req.originalUrl);

    const companyId = req.params.companyId;
    console.log("Looking for company with ID:", companyId);

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

    // Get all headers by setting header:1 option
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Extract headers from the first row
    const headers = data.length > 0 ? data[0] : [];

    // Convert the rest of the data to objects using the headers
    const jsonData = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      jsonData.push(obj);
    }

    if (headers.length === 0) {
      return res.status(400).json({
        message: "Excel file has no headers or is empty",
      });
    }

    // Return only headers and company ID
    return res.status(200).json({
      message: "Excel file headers retrieved successfully",
      headers: headers,
      companyId: companyId,
      file: {
        originalname: req.file.originalname,
        size: req.file.size,
      },
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

// Map Excel columns to inventory fields and create inventory
const mapInventoryExcel = async (req, res) => {
  try {
    console.log("=============================================");
    console.log("EXCEL MAPPING ENDPOINT CALLED");
    console.log("Request body:", req.body);

    const { columnMappings, inventoryName } = req.body;
    const companyId = req.params.companyId;

    // Validate required parameters
    if (!req.file || !columnMappings) {
      return res.status(400).json({
        message:
          "Missing required parameters: Excel file and columnMappings are required",
      });
    }

    // Process the Excel file directly from buffer
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get all headers by setting header:1 option
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Extract headers from the first row
    const headers = rawData.length > 0 ? rawData[0] : [];

    // Convert the rest of the data to objects using the headers
    const data = [];
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = row[j];
      }
      data.push(obj);
    }

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Parse column mappings if it's a string
    const mappings =
      typeof columnMappings === "string"
        ? JSON.parse(columnMappings)
        : columnMappings;

    console.log("Column mappings:", mappings);

    // Define required fields
    const requiredFields = [
      "baleNumberField", // bail_number
      "designCodeField", // design_code
      "stockAmountField", // stock_amount
    ];

    // Check for required fields
    const missingRequiredFields = requiredFields.filter(
      (field) => !mappings[field]
    );

    if (missingRequiredFields.length > 0) {
      return res.status(400).json({
        message: "Missing required column mappings",
        missingFields: missingRequiredFields,
        availableHeaders: headers,
      });
    }

    // These fields are optional and can be handled with defaults if missing
    const optionalFields = ["dateField", "categoryField", "lotNumberField"];

    // Log which optional fields are missing
    const missingOptionalFields = optionalFields.filter(
      (field) => !mappings[field]
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

    const inventoryDoc = await Inventory.findOne({ company: companyId });
    if (!inventoryDoc) {
      return res.status(404).json({
        message: "Inventory not found",
      });
    }

    // Process each row in the Excel file
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Get values using the user-defined column mappings
        const baleNumberField = mappings.baleNumberField;
        const dateField = mappings.dateField || null;
        const categoryField = mappings.categoryField || null;
        const designCodeField = mappings.designCodeField || null;
        const lotNumberField = mappings.lotNumberField || null;
        const stockAmountField = mappings.stockAmountField || null;

        // Get values from the row, with fallbacks for missing values
        const bailNumber = row[baleNumberField] || "";

        // Handle missing mappings or values with defaults
        const bailDate =
          dateField && row[dateField] ? new Date(row[dateField]) : new Date();

        const categoryCode =
          categoryField && row[categoryField] ? row[categoryField] : "";

        const designCode =
          designCodeField && row[designCodeField] ? row[designCodeField] : "";

        // For lot_number, use the mapped field or try to find a suitable alternative
        let lotNumber = "";
        if (lotNumberField && row[lotNumberField]) {
          lotNumber = row[lotNumberField];
        }

        const stockAmount =
          stockAmountField && row[stockAmountField]
            ? parseFloat(row[stockAmountField])
            : 0;

        // Check if we have the minimum required data
        if (!bailNumber) {
          throw new Error(`Missing bale number in row ${i + 1}`);
        }

        if (!designCode) {
          throw new Error(`Missing design code in row ${i + 1}`);
        }

        // Create new inventory product
        const inventoryProduct = new InventoryProduct({
          bail_number: bailNumber,
          bail_date: bailDate,
          design_code: designCode,
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
      filename: "Excel Upload",
      originalname: "Excel Upload",
      path: "local-storage", // Since we're using local storage
      size: 0,
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
      inventory: {
        id: inventoryDoc._id,
        name: inventoryDoc.inventoryName,
        productCount: processingResults.success,
      },
      columnMappings: mappings,
      missingOptionalFields: missingOptionalFields || [],
      results: processingResults,
      uploadId: excelUpload._id,
    });
  } catch (err) {
    console.error("Error mapping Excel file:", err);
    res.status(500).json({
      message: "Error mapping Excel file",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

module.exports = {
  uploadInventoryExcel,
  mapInventoryExcel,
};
