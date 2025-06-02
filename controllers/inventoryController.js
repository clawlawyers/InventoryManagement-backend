const Company = require("../models/Company");
const Inventory = require("../models/Inventory");

const createInventory = async (req, res) => {
  try {
    const { inventoryName, companyId } = req.body;

    // Check if company belongs to the manager
    // const companyExists = req.user.user.companies.includes(companyId);
    // if (!companyExists) {
    //   return res.status(403).json({
    //     message: "Forbidden: Company does not belong to this manager",
    //   });
    // }

    const newInventory = new Inventory({
      inventoryName,
      company: companyId,
    });

    await newInventory.save();
    const updateCompany = await Company.findByIdAndUpdate(
      companyId,
      { inventory: newInventory._id },
      { new: true }
    );

    res.status(201).json(updateCompany);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getProductByProductId = async (req, res) => {
  try {
    console.log("Req is coming");
    // if (req.user.type !== "manager") {
    //   return res.status(401).json({ message: "Unauthorized" });
    // }
    const inventoryId = req.params.id;

    console.log(inventoryId);
    const inventory = await Inventory.findById(inventoryId).populate(
      "products"
    );

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    res.json(inventory.products);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { createInventory, getProductByProductId };
