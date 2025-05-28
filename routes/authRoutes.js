const express = require("express");
const router = express.Router();
const {
  managerLogin,
  salesmanLogin,
  managerSignup,
  getVerify,
  accountCreatationRequest,
  getVerifyUser,
} = require("../controllers/authController");

// Auth routes
router.post("/manager/login", managerLogin);
router.post("/manager/signup", managerSignup);
router.get("/getVerify", getVerify);
router.get("/getVerifyUser", getVerifyUser);
router.post("/salesman/login", salesmanLogin);

router.post("/accountCreatationRequest", accountCreatationRequest);

module.exports = router;
