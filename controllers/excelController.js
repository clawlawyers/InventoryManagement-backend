const xlsx = require("xlsx");
const Salesman = require("../models/Salesman");
const Client = require("../models/Client");

// Upload and process Excel file
const uploadExcelFile = async (req, res) => {
  try {
    const { salesmanId } = req.params;

    // Check if salesman exists
    const salesman = await Salesman.findById(salesmanId);
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
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

    // Process data (e.g., create clients from Excel data)
    const processingResults = {
      success: 0,
      errors: 0,
      details: [],
    };

    // Process each row in the Excel file
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Validate required fields
        if (
          !row.name ||
          !row.phone ||
          !row.address ||
          !row.city ||
          !row.state ||
          !row.zipCode
        ) {
          throw new Error("Missing required fields");
        }

        // Check if client with this phone already exists
        const existingClient = await Client.findOne({ phone: row.phone });
        if (existingClient) {
          throw new Error("Phone number already registered to another client");
        }

        // Create new client
        const client = new Client({
          name: row.name,
          phone: row.phone,
          email: row.email || "",
          address: row.address,
          city: row.city,
          state: row.state,
          zipCode: row.zipCode,
          notes: row.notes || "",
          salesman: salesmanId,
        });

        await client.save();

        processingResults.success++;
        processingResults.details.push({
          row: i + 1,
          message: "Client created successfully",
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

    // Return processing results directly
    res.status(200).json({
      message: "Excel file processed",
      file: {
        originalname: req.file.originalname,
      },
      results: processingResults,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Since we're not storing Excel uploads anymore, this function is simplified
const getExcelUploads = async (req, res) => {
  try {
    const { salesmanId } = req.params;

    // Check if salesman exists
    const salesman = await Salesman.findById(salesmanId);
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    // Return an empty array since we don't store uploads anymore
    res.json([]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  uploadExcelFile,
  getExcelUploads,
};
