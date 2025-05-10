const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PermissionSchema = new Schema({
  delete: {
    type: Boolean,
    required: false,
  },
  add: {
    type: Boolean,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  salesman: {
    type: Schema.Types.ObjectId,
    ref: "Salesman",
    required: true,
  },
});

module.exports = mongoose.model("Permission", PermissionSchema);
