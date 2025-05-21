const multer = require("multer");
const path = require("path");

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter to accept only Excel files
const fileFilter = (req, file, cb) => {
  const filetypes = /xlsx|xls/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  // Accept these specific Excel mimetypes
  const validMimetypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "application/octet-stream", // Some clients send this for binary files
  ];

  // Debug information
  console.log("File details:");
  console.log("Original name:", file.originalname);
  console.log("Mimetype:", file.mimetype);
  console.log("Extension test:", extname);

  if (extname && validMimetypes.includes(file.mimetype)) {
    return cb(null, true);
  } else {
    cb(new Error("Only Excel files are allowed!"), false);
  }
};

// Create the multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

module.exports = upload;
