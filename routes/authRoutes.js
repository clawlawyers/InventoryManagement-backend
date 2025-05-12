const express = require("express");
const router = express.Router();
const {
  managerLogin,
  salesmanLogin,
  managerSignup,
} = require("../controllers/authController");

// Auth routes
router.post("/manager/login", managerLogin);
router.post("/manager/signup", managerSignup);
router.post("/salesman/login", salesmanLogin);

module.exports = router;
