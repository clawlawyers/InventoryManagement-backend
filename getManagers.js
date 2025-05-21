const mongoose = require('mongoose');
const Manager = require('./models/Manager');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const managers = await Manager.find().select('_id name');
      console.log('Available Managers:');
      if (managers.length === 0) {
        console.log('No managers found in the database.');
      } else {
        managers.forEach(m => {
          console.log(`ID: ${m._id}, Name: ${m.name}`);
        });
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });
