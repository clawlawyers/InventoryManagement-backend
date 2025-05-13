const xlsx = require("xlsx");
const ExcelUpload = require("../models/ExcelUpload");
const Inventory = require("../models/Inventory");
const Company = require("../models/Company");

// Upload and process inventory Excel file
const uploadInventoryExcel = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Check if company exists
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Create a record of the upload
    const excelUpload = new ExcelUpload({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      // Use a hardcoded salesman ID for testing
      salesman: "682066d2bea63f59170b4084", // Replace with a valid salesman ID from your database
      processed: false,
    });

    await excelUpload.save();

    // Process the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Get column headers from the first row
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    // Process data (create inventory items from Excel data)
    const processingResults = {
      success: 0,
      errors: 0,
      details: [],
      headers: headers, // Add headers to the response
    };

    // Process each row in the Excel file
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Validate required fields
        if (
          !row["Entry Date"] ||
          !row["Full Bale No."] ||
          !row["Item Name"] ||
          !row["Lot No"] ||
          !row["Stock Act Mt"]
        ) {
          throw new Error("Missing required fields");
        }

        // Create new inventory item
        const inventory = new Inventory({
          bail_number: row["Full Bale No."],
          bail_date: new Date(row["Entry Date"]),
          category_code: row["Item Name"],
          lot_number: row["Lot No"],
          stock_amount: row["Stock Act Mt"],
          company: companyId,
        });

        await inventory.save();

        // Add inventory to company
        company.inventories.push(inventory._id);
        await company.save();

        processingResults.success++;
        processingResults.details.push({
          row: i + 1,
          message: "Inventory item created successfully",
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

    // Update the upload record with processing results
    excelUpload.processed = true;
    excelUpload.processingResults = processingResults;
    await excelUpload.save();

    // Expected headers
    const expectedHeaders = [
      "Entry Date",
      "Full Bale No.",
      "Item Name",
      "Design No",
      "Lot No",
      "Stock Act Mt",
      "chat_id",
    ];

    res.status(200).json({
      message: "Inventory Excel file processed",
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
      },
      expectedHeaders: expectedHeaders,
      actualHeaders: headers,
      results: processingResults,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadInventoryExcel,
};
