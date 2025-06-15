const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

require("dotenv").config();

const corsOptions = {
  origin: "*", // Updated to match frontend port
};

const routes = require("./routes/route");
const adminRoutes = require("./routes/adminRoutes");

// Enable CORS for all routes
app.use(cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log("=============================================");
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});
app.use("/api", routes);
app.use("/api/admin", adminRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(8800, () => console.log("Server running on port 8800"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
