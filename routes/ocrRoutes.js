const express = require("express");
const router = express.Router();
const imageUpload = require("../middleware/imageUpload");
const { processImageOCR, getDesignsByUser } = require("../controllers/ocrController");

// OCR routes
router.post("/process", imageUpload.single("image"), processImageOCR);
router.get("/designs/:userId", getDesignsByUser);

module.exports = router;
