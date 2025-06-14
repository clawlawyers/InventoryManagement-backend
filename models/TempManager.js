const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TempManagerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  GSTNumber: {
    type: String,
    required: true,
  },
  organisationName: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    default: "false",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  approvedAt: {
    type: Date,
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: "Admin",
  },
  rejectionReason: {
    type: String,
  },
});

module.exports = mongoose.model("TempManager", TempManagerSchema);
