const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  firmName: {
    type: String,
    required: false,
  },
  firmGSTNumber: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  salesman: {
    type: Schema.Types.ObjectId,
    ref: "Salesman",
    required: false,
  },
  // For potential future use - linking clients to orders/invoices
  invoices: [
    {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
  ],
});

module.exports = mongoose.model("ClientTextile", ClientSchema);
