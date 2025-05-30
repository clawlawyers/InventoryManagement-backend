const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema({
  // Invoice identification
  invoiceNumber: {
    type: String,
  },

  // Related entities
  order: {
    type: Schema.Types.ObjectId,
    ref: "OrderTextile",
  },
  payment: {
    type: Schema.Types.ObjectId,
    ref: "Payment",
  },
  client: {
    type: Schema.Types.ObjectId,
    ref: "ClientTextile",
  },
  company: {
    type: Schema.Types.ObjectId,
    ref: "Company",
  },

  // Products (from the order, proportional to payment)
  products: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: "InventoryProduct",
    },
    quantity: {
      type: Number,
      min: 1,
    },
    unitPrice: {
      type: Number,
      min: 0,
    },
    totalPrice: {
      type: Number,
      min: 0,
    },
  }],

  // Financial details
  subtotal: {
    type: Number,
    min: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalAmount: {
    type: Number,
    min: 0,
  },

  // Payment details
  paymentAmount: {
    type: Number,
    min: 0,
  },
  paymentMethod: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
  paymentReference: {
    type: String,
  },

  // Invoice status and dates
  status: {
    type: String,
    enum: ["draft", "sent", "paid", "cancelled"],
    default: "paid", // Since invoice is created after payment
  },
  invoiceDate: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },

  // Creator information
  createdBy: {
    type: Schema.Types.ObjectId,
    refPath: "creatorType",
  },
  creatorType: {
    type: String,
    enum: ["Manager", "SalesmanTextile"],
  },

  // Additional information
  notes: {
    type: String,
  },
  terms: {
    type: String,
    default: "Payment received - Thank you for your business",
  },

  // PDF generation
  pdfGenerated: {
    type: Boolean,
    default: false,
  },
  pdfPath: {
    type: String,
  },

  // Timestamps
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
InvoiceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Generate invoice number before saving (if not provided)
InvoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

    // Find the last invoice for this month
    const lastInvoice = await this.constructor
      .findOne({
        invoiceNumber: new RegExp(`^INV-${currentYear}${currentMonth}-`),
      })
      .sort({ invoiceNumber: -1 });

    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split("-")[2]);
      nextNumber = lastNumber + 1;
    }

    this.invoiceNumber = `INV-${currentYear}${currentMonth}-${String(
      nextNumber
    ).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Invoice", InvoiceSchema);