const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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

const CartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "userType",
  },
  userType: {
    type: String,
    required: true,
    enum: ["Manager", "Salesman"],
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index to ensure one cart per user
CartSchema.index({ user: 1, userType: 1 }, { unique: true });

// Update the updatedAt field and calculate totals before saving
CartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  
  // Calculate totals
  this.totalAmount = 0;
  this.totalItems = 0;
  
  this.items.forEach((item) => {
    this.totalAmount += item.totalPrice;
    this.totalItems += item.quantity;
  });
  
  next();
});

// Method to add item to cart
CartSchema.methods.addItem = function (inventoryProduct, quantity, unitPrice) {
  const existingItemIndex = this.items.findIndex(
    (item) => item.inventoryProduct.toString() === inventoryProduct.toString()
  );
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].quantity * this.items[existingItemIndex].unitPrice;
  } else {
    // Add new item
    this.items.push({
      inventoryProduct,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
    });
  }
};

// Method to update item quantity
CartSchema.methods.updateItemQuantity = function (inventoryProductId, newQuantity) {
  const itemIndex = this.items.findIndex(
    (item) => item.inventoryProduct.toString() === inventoryProductId.toString()
  );
  
  if (itemIndex > -1) {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      this.items.splice(itemIndex, 1);
    } else {
      // Update quantity and total price
      this.items[itemIndex].quantity = newQuantity;
      this.items[itemIndex].totalPrice = 
        this.items[itemIndex].quantity * this.items[itemIndex].unitPrice;
    }
    return true;
  }
  return false;
};

// Method to remove item from cart
CartSchema.methods.removeItem = function (inventoryProductId) {
  const itemIndex = this.items.findIndex(
    (item) => item.inventoryProduct.toString() === inventoryProductId.toString()
  );
  
  if (itemIndex > -1) {
    this.items.splice(itemIndex, 1);
    return true;
  }
  return false;
};

// Method to clear all items
CartSchema.methods.clearCart = function () {
  this.items = [];
  this.totalAmount = 0;
  this.totalItems = 0;
};

module.exports = mongoose.model("Cart", CartSchema);
