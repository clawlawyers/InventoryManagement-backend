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
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  user_type: {
    type: String,
    required: true,
    default: "salesman",
  },
  permissions: {
    type: Schema.Types.ObjectId,
    ref: "Permission",
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  manager: {
    type: Schema.Types.ObjectId,
    ref: "Manager",
    required: true,
  },
});

module.exports = mongoose.model("Salesman", SalesmanSchema);
