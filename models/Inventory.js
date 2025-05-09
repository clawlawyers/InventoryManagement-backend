const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InventorySchema = new Schema({
  bail_number: {
    type: String,
    required: true,
  },
  bail_date: {
    type: Date,
    required: true,
  },
  category_code: {
    type: String,
    required: true,
  },
  lot_number: {
    type: String,
    required: true,
  },
  stock_amount: {
    type: Number,
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
});

module.exports = mongoose.model("Inventory", InventorySchema);
