const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    // Inherit fields from Manager and Salesman if needed
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    // Add any admin-specific fields here
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
