const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderProductSchema = new Schema(
  {
    inventoryProduct: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema({
  // Support for multiple inventory products
  products: {
    type: [OrderProductSchema],
    required: true,
    validate: {
      validator: function (products) {
        return products && products.length > 0;
      },
      message: "At least one product is required",
    },
  },
  // Keep legacy fields for backward compatibility
  productName: {
    type: String,
    required: false,
  },
  category: {
    type: String,
    required: false,
  },
  quantity: {
    type: Number,
    required: false,
    min: 1,
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "Client",
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "creatorType",
  },
  creatorType: {
    type: String,
    required: true,
    enum: ["Manager", "Salesman"],
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "processing", "completed", "cancelled"],
    default: "pending",
  },
  // Payment-related fields
  totalAmount: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  paidAmount: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  dueAmount: {
    type: Number,
    required: false,
    min: 0,
    default: 0,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "partial", "paid", "overdue"],
    default: "pending",
  },
  paymentDueDate: {
    type: Date,
    required: false,
  },
  // Array to store payment references
  payments: [
    {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field and calculate payment status before saving
OrderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // Calculate due amount
  this.dueAmount = this.totalAmount - this.paidAmount;

  // Update payment status based on amounts
  if (this.totalAmount === 0) {
    this.paymentStatus = "pending";
  } else if (this.paidAmount === 0) {
    this.paymentStatus = "pending";
  } else if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = "paid";
    this.dueAmount = 0;
  } else {
    this.paymentStatus = "partial";
  }

  // Check for overdue status
  if (
    this.paymentDueDate &&
    this.paymentDueDate < new Date() &&
    this.paymentStatus !== "paid"
  ) {
    this.paymentStatus = "overdue";
  }

  next();
});

// Method to calculate total amount from products
OrderSchema.methods.calculateTotalAmount = function () {
  let total = 0;
  this.products.forEach((product) => {
    total += product.totalPrice;
  });
  this.totalAmount = total;
  this.dueAmount = this.totalAmount - this.paidAmount;
  return total;
};

module.exports = mongoose.model("Order", OrderSchema);
