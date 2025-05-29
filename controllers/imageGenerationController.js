const cloudinary = require("../cloudinary");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

// Utility function to upload image to Cloudinary
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

// Utility function to forward requests to image service
const forwardToImageService = async (endpoint, formData) => {
  try {
    const response = await axios.post(
      `http://20.33.90.22:8000/${endpoint}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return { success: false, error };
  }
};

// 1. Create Image Controller
const createImage = async (req, res) => {
  try {
    const { description, style, color_info, simplicity, n_options } = req.body;

    // Create form data for the image service
    const formData = new FormData();
    formData.append("description", description);
    formData.append("style", style || "");
    formData.append("color_info", color_info || "");
    formData.append("simplicity", simplicity || "5");
    formData.append("n_options", n_options || "1");

    // Forward to image service
    const result = await forwardToImageService("create_image", formData);

    if (!result.success) {
      throw result.error;
    }

    res.status(200).json({
      message: "Image created successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("Image creation error:", err);
    res.status(500).json({ error: "Image creation failed" });
  }
};

// 2. Edit Image Controller
const editImage = async (req, res) => {
  try {
    const { description } = req.body;

    if (!req.file && !req.body.image) {
      return res.status(400).json({ error: "No image file provided" });
    }

    let uploadResult;
    const formData = new FormData();

    if (!req.body.image) {
      // Upload image to Cloudinary
      uploadResult = await uploadImageToCloudinary(req.file.path);

      if (!uploadResult.success) {
        throw uploadResult.error;
      }
      formData.append("image", uploadResult.url);
    } else {
      formData.append("image", req.body.image);
    }

    // Create form data for the image service

    formData.append("description", description);

    console.log(formData);

    // Forward to image service
    const result = await forwardToImageService("edit_image", formData);

    if (!result.success) {
      throw result.error;
    }

    res.status(200).json({
      message: "Image edited successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("Image edit error:", err);
    res.status(500).json({ error: "Image edit failed" });
  }
};

// 3. Create Index Controller
const createIndex = async (req, res) => {
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({ error: "No image file provided" });
    }

    let uploadResult;

    // Create form data for the image service
    let formData = new FormData();

    if (!req.body.image) {
      // Upload image to Cloudinary
      uploadResult = await uploadImageToCloudinary(req.file.path);

      if (!uploadResult.success) {
        throw uploadResult.error;
      }

      formData.append("image", uploadResult.url);
    } else {
      formData.append("image", req.body.image);
    }

    // Forward to image service
    const result = await forwardToImageService("create_index", formData);

    if (!result.success) {
      throw result.error;
    }

    res.status(200).json({
      message: "Index created successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("Index creation error:", err);
    res.status(500).json({ error: "Index creation failed" });
  }
};

// 4. Edit Colors Controller
const editColors = async (req, res) => {
  try {
    const { palette_json_url, indices, hex_colors } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadImageToCloudinary(req.file.path);

    if (!uploadResult.success) {
      throw uploadResult.error;
    }

    // Create form data for the image service
    const formData = new FormData();
    formData.append("image", uploadResult.url);
    formData.append("palette_json_url", palette_json_url);
    formData.append("indices", indices);
    formData.append("hex_colors", hex_colors);

    // Forward to image service
    const result = await forwardToImageService("edit_colors", formData);

    if (!result.success) {
      throw result.error;
    }

    res.status(200).json({
      message: "Colors edited successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("Color edit error:", err);
    res.status(500).json({ error: "Color edit failed" });
  }
};

// 5. Tile Image Grid Controller
const tileImageGrid = async (req, res) => {
  try {
    const { grid_rows, grid_cols } = req.body;

    if (!req.file && !req.body.image) {
      return res.status(400).json({ error: "No image file provided" });
    }

    let uploadResult;
    if (!req.body.image) {
      // Upload image to Cloudinary
      uploadResult = await uploadImageToCloudinary(req.file.path);

      if (!uploadResult.success) {
        throw uploadResult.error;
      }
    } else {
      uploadResult = { success: true, url: req.body.image };
    }

    // Create form data for the image service
    const formData = new FormData();
    formData.append("image", uploadResult.url);
    formData.append("rows", grid_rows || "5");
    formData.append("cols", grid_cols || "5");

    // Forward to image service
    const result = await forwardToImageService("tile_image_grid", formData);

    if (!result.success) {
      throw result.error;
    }

    res.status(200).json({
      message: "Image tiled successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("Image tiling error:", err);
    res.status(500).json({ error: "Image tiling failed" });
  }
};

module.exports = {
  createImage,
  editImage,
  createIndex,
  editColors,
  tileImageGrid,
  uploadImageToCloudinary,
};
