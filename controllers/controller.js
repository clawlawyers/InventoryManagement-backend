// This file is now deprecated.
// Please use the specific controller files:
// - managerController.js
// - companyController.js

// Re-export controllers for backward compatibility
const managerController = require("./managerController");
const companyController = require("./companyController");

module.exports = {
  ...managerController,
  ...companyController,
};
