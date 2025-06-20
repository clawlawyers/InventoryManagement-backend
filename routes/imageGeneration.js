const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  createImage,
  editImage,
  createIndex,
  editColors,
  tileImageGrid,
  convertToEps,
} = require("../controllers/imageGenerationController");
const { requireAuth } = require("../middleware/requireAuth");

// Multer setup
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

// New image processing routes
router.post("/create-image", createImage);
router.post("/edit-image", upload.single("image"), editImage);
router.post("/create-index", upload.single("image"), createIndex);
router.post("/edit-colors", upload.single("image"), editColors);
router.post("/tile-image-grid", upload.single("image"), tileImageGrid);
router.post("/convert_to_eps", upload.none(), convertToEps);

module.exports = router;
