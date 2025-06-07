const mongoose = require("mongoose");

const deleteManagerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
});

const deleteManagerRequest = mongoose.model(
  "DeleteManagerRequest",
  deleteManagerSchema
);

module.exports = deleteManagerRequest;
