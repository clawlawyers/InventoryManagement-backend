const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CompanySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  inventories: [
    {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
    },
  ],
});
