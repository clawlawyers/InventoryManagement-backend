const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InventorySchema = new Schema({
  inventoryName: {
    type: String,
    required: true,
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      required: true,
    },
  ],
});

module.exports = mongoose.model("Inventory", InventorySchema);
