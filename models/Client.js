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
  email: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  salesman: {
    type: Schema.Types.ObjectId,
    ref: "Salesman",
    required: true,
  },
  // For potential future use - linking clients to orders/invoices
  invoices: [
    {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
  ],
});

module.exports = mongoose.model("Client", ClientSchema);
