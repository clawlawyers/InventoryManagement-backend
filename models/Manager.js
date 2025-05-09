const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ManagerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  companies: [
    {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
  ],
  salesmen: [
    {
      type: Schema.Types.ObjectId,
      ref: "Salesman",
    },
  ],
});

module.exports = mongoose.model("Manager", ManagerSchema);
