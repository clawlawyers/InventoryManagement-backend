const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PermissionSchema = new Schema({
  deleteClient: {
    type: Boolean,
    required: false,
    default: false,
  },
  addClient: {
    type: Boolean,
    required: false,
    default: false,
  },
  generateInvoice: {
    type: Boolean,
    required: false,
    default: false,
  },
  viewInventory: {
    type: Boolean,
    required: false,
    default: false,
  },
  editInventory: {
    type: Boolean,
    required: false,
    default: false,
  },
  description: {
    type: String,
    required: false,
  },
  salesman: {
    type: Schema.Types.ObjectId,
    ref: "Salesman",
    required: false, // Changed to false to allow initial creation without a salesman reference
  },
});

module.exports = mongoose.model("Permission", PermissionSchema);
