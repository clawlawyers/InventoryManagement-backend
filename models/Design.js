const mongoose = require("mongoose");

const DesignSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    designNumber: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    fullPath: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for userId, category, and designNumber
DesignSchema.index({ userId: 1, category: 1, designNumber: 1 });

module.exports = mongoose.model("Design", DesignSchema);
