const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
  },
  // Reference to InventoryProduct if item is from inventory
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryProduct",
    required: false,
  },
});

// Embedded payment schema for custom orders
const customOrderPaymentSchema = new mongoose.Schema({
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
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  notes: {
    type: String,
    required: false,
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "Manager", // or "SalesmanTextile" if needed
  },
  receivedByType: {
    type: String,
    enum: ["Manager", "SalesmanTextile"],
    required: false,
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

const customOrderSchema = new mongoose.Schema({
  billingFrom: {
    firmName: {
      type: String,
      required: true,
    },
    firmAddress: {
      type: String,
      required: true,
    },
    firmGstNumber: {
      type: String,
      required: true,
    },
  },
  billingTo: {
    firmName: {
      type: String,
      required: true,
    },
    firmAddress: {
      type: String,
      required: true,
    },
    firmGstNumber: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: Number,
      required: true,
    },
  },
  billingDetails: {
    billingDate: {
      type: Date,
      required: true,
    },
    billingDueDate: {
      type: Date,
      required: true,
    },
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  dueAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  gstPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  items: [itemSchema], // Array of item sub-documents
  payments: [customOrderPaymentSchema], // Embedded payments for custom orders
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` field on save
customOrderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const CustomOrder = mongoose.model("CustomOrder", customOrderSchema);

module.exports = CustomOrder;
