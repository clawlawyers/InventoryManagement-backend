const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "../uploads/images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original name and timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter to accept only image files
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|bmp|tiff/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Accept these specific image mimetypes
  const validMimetypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/bmp",
    "image/tiff",
  ];

  // Debug information
  console.log("Image file details:");
  console.log("Original name:", file.originalname);
  console.log("Mimetype:", file.mimetype);
  console.log("Extension test:", extname);

  if (extname && validMimetypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Create the multer upload instance
const imageUpload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  },
});

module.exports = imageUpload;
