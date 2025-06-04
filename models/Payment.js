const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentSchema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: "OrderTextile",
    required: true,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "ClientTextile",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMethod: {
    type: String,
    enum: [
      "Cash",
      "Bank_transfer",
      "Cheque",
      "UPI",
      "Card",
      "other",
      "Advance",
      "RTGS/NEFT",
    ],
    default: "cash",
  },
  paymentReference: {
    type: String,
    required: false,
    // For storing transaction ID, cheque number, etc.
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    required: false,
  },
  discountPercentage: {
    type: Number,
    required: false,
    min: 0,
    max: 100,
  },
  discountValue: {
    type: Number,
    required: false,
    min: 0,
  },
  gst: {
    type: Number,
    required: false,
  },
  receivedBy: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "receivedByType",
  },
  receivedByType: {
    type: String,
    required: true,
    enum: ["Manager", "SalesmanTextile"],
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "failed", "refunded"],
    default: "confirmed",
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
PaymentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Payment", PaymentSchema);
