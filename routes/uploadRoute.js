// routes/uploadRoute.js
const express = require("express");
const multer = require("multer");
const cloudinary = require("../cloudinary");
const fs = require("fs");
const router = express.Router();
const InventoryProduct = require("../models/InventoryProduct");
const Inventory = require("../models/Inventory");
const { requireAuth } = require("../middleware/requireAuth");

// Multer setup with file size limit (200KB = 200 * 1024 bytes)
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 200 * 1024, // 200KB in bytes
  },
});

// Error handler for multer file size limit
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "File size exceeds the 200KB limit" });
  }
  next(err);
};

router.post(
  "/upload",
  requireAuth,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  async (req, res) => {
    try {
      // if (req.user.type !== "manager") {
      //   return res.status(401).json({ message: "Unauthorized" });
      // }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const filePath = req.file.path;
      const {
        bail_number,
        bail_date,
        category_code,
        lot_number,
        stock_amount,
        design_code,
        inventoryId,
      } = req.body;

      // Upload image to cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "uploads",
        resource_type: "image",
      });

      // Delete local file after upload
      fs.unlinkSync(filePath);

      // Create inventory product with the image URL
      const inventoryProduct = new InventoryProduct({
        bail_number,
        bail_date,
        category_code,
        lot_number,
        stock_amount,
        design_code,
        image: result.secure_url,
      });

      await inventoryProduct.save();

      // Add product to inventory
      if (inventoryId) {
        await Inventory.findByIdAndUpdate(inventoryId, {
          $push: { products: inventoryProduct._id },
        });
      }

      res.status(200).json({
        message: "Image uploaded and product created successfully",
        url: result.secure_url,
        product: inventoryProduct,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({
        error: "Image upload or product creation failed",
        details: err.message,
      });
    }
  }
);

const uploadImageToCloudinary = async (filePath) => {
  try {
    // Upload image to cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "uploads",
      resource_type: "image",
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return { success: true, url: result.secure_url };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return { success: false, error };
  }
};

router.post(
  "/upload-image",
  // requireAuth,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  async (req, res) => {
    try {
      // if (req.user.type !== "manager") {
      //   return res.status(401).json({ message: "Unauthorized" });
      // }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const uploadResult = await uploadImageToCloudinary(req.file.path);

      if (!uploadResult.success) {
        throw uploadResult.error;
      }

      // Return only the image URL
      res.status(200).json({
        message: "Image uploaded successfully",
        url: uploadResult.url,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res
        .status(500)
        .json({ error: "Image upload failed", details: err.message });
    }
  }
);

module.exports = router;
