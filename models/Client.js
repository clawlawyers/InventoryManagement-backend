const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Cart Item Schema for embedded cart
const CartItemSchema = new Schema(
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

// Cart Schema for embedded cart
const CartSchema = new Schema(
  {
    items: {
      type: [CartItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const ClientSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  firmName: {
    type: String,
    required: false,
  },
  firmGSTNumber: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  salesman: {
    type: Schema.Types.ObjectId,
    ref: "Salesman",
    required: false,
  },
  // Embedded cart for this client
  cart: {
    type: CartSchema,
    default: () => ({
      items: [],
      totalAmount: 0,
      totalItems: 0,
      updatedAt: Date.now(),
    }),
  },
  // For potential future use - linking clients to orders/invoices
  invoices: [
    {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },
  ],
});

// Note: Cart methods are now handled in the controller

module.exports = mongoose.model("Client", ClientSchema);
