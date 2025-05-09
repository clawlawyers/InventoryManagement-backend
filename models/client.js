const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clientSchema = {
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
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
};

module.exports = clientSchema;
