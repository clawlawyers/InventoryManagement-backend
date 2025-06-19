const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WalletTopUpOrderSchema = new Schema({
  manager: {
    type: Schema.Types.ObjectId,
    ref: "Manager",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 1, // Minimum top-up amount
  },
  currency: {
    type: String,
    required: true,
    default: "INR",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
WalletTopUpOrderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("WalletTopUpOrder", WalletTopUpOrderSchema);
