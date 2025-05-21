const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InventoryProductSchema = new Schema({
  bail_number: {
    // product ID
    type: String,
    required: true,
  },
  bail_date: {
    // defualt
    type: Date,
    default: Date.now,
  },
  design_code: {
    type: String,
    required: false,
  },
  category_code: {
    //category code
    type: String,
    default: "",
  },
  lot_number: {
    // lot number
    type: String,
    default: "",
  },
  stock_amount: {
    type: Number,
    default: 0,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("InventoryProduct", InventoryProductSchema);
