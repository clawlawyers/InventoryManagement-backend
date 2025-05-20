const Company = require("../models/Company");
const Inventory = require("../models/Inventory");

const createInventory = async (req, res) => {
  try {
    const { inventoryName, companyId } = req.body;
    const newInventory = new Inventory({
      inventoryName,
      company: companyId,
    });
    await newInventory.save();
    const updateCompany = await Company.findByIdAndUpdate(companyId, {
      $push: { inventory: newInventory._id },
    });
    res.status(201).json(newInventory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createInventory };
