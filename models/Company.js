const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompanySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  GSTNumber: {
    type: String,
    required: true,
  },
  inventory: {
    type: Schema.Types.ObjectId,
    ref: "Inventory",
  },
});

module.exports = mongoose.model("Company", CompanySchema);
