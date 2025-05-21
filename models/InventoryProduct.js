const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InventoryProductSchema = new Schema({
  bail_number: {
    type: String,
    required: true,
  },
  bail_date: {
    type: Date,
    default: Date.now,
  },
  category_code: {
    type: String,
    default: "",
  },
  lot_number: {
    type: String,
    default: "",
  },
  stock_amount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("InventoryProduct", InventoryProductSchema);
