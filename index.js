const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const app = express();

require("dotenv").config();

const routes = require("./routes/route");

app.use(express.json());

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error handling middleware for file uploads
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File too large" });
  }

  if (err.message === "Only Excel files are allowed!") {
    return res.status(415).json({ message: err.message });
  }

  if (err.message === "Only image files are allowed!") {
    return res.status(415).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: "Internal server error" });
});

app.use("/", routes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(8800, () => console.log("Server running on port 8800"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
