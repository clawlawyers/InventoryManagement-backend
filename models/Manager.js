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
  phoneNumber: {
    type: String,
    required: true,
  },
  password: {
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
  wallet: {
    coins: { type: Number, default: 100 },
    plan: {
      type: String,
      enum: ["default", "starter", "pro", "elite", "custom"],
      default: "default", // New default plan
    },
    planStartDate: {
      type: Date,
      default: Date.now,
    },
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
      ref: "SalesmanTextile",
    },
  ],
});

module.exports = mongoose.model("Manager", ManagerSchema);
