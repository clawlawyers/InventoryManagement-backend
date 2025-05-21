const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExcelUploadSchema = new Schema({
  filename: {
    type: String,
    required: true,
  },
  originalname: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  salesman: {
    type: Schema.Types.ObjectId,
    ref: "Salesman",
    required: false, // Changed to false to allow uploads without a salesman reference
  },
  processed: {
    type: Boolean,
    default: false,
  },
  processingResults: {
    success: {
      type: Number,
      default: 0,
    },
    errors: {
      type: Number,
      default: 0,
    },
    details: [
      {
        row: Number,
        message: String,
        success: Boolean,
      },
    ],
  },
});

module.exports = mongoose.model("ExcelUpload", ExcelUploadSchema);
