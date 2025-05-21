const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  item: {
    type: Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  purchased: {
    type: Number,
    default: 0,
  },
  paid: {
    type: Number,
    default: 0,
  },
  pending_total: {
    type: Number,
    default: 0,
  },
  amount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Invoice", InvoiceSchema);
