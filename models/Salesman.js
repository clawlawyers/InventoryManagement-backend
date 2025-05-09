const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SalesmanSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  user_type: {
    type: String,
    required: true,
    default: "salesman",
  },
  permissions: {
    type: [String],
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Salesman", SalesmanSchema);
