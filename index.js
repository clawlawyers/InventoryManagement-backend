const express = require("express");
const mongoose = require("mongoose");
const app = express();

require("dotenv").config();

const routes = require("./routes/route");

app.use(express.json());
app.use("/api", routes);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(8800, () => console.log("Server running on port 8800"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
