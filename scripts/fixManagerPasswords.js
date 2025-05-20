const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

// Import Manager model
const Manager = require("../models/Manager");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected for fixing passwords"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to hash passwords for all managers
const fixManagerPasswords = async () => {
  try {
    // Get all managers
    const managers = await Manager.find({});
    console.log(`Found ${managers.length} managers to update`);

    // Update each manager with a hashed password
    for (const manager of managers) {
      // Skip if the password is already hashed (longer than 20 chars is a good indicator)
      if (manager.password.length > 20) {
        console.log(`Manager ${manager.email} already has a hashed password`);
        continue;
      }

      // Store the original password for logging
      const originalPassword = manager.password;
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(manager.password, 10);
      
      // Update the manager
      manager.password = hashedPassword;
      await manager.save();
      
      console.log(`Updated password for manager ${manager.email} (${originalPassword} -> hashed)`);
    }

    console.log("All manager passwords have been hashed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error fixing manager passwords:", error);
    process.exit(1);
  }
};

// Run the function
fixManagerPasswords();
