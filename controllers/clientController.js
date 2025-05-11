const Client = require("../models/Client");
const Salesman = require("../models/Salesman");

// Create a new client
const createClient = async (req, res) => {
  try {
    const { name, phone, email, address, city, state, zipCode, notes } =
      req.body;

    // Get salesmanId from route parameters
    const salesmanId = req.params.salesmanId;

    // Validate required fields
    if (!name || !phone || !address || !city || !state || !zipCode) {
      return res.status(400).json({
        message: "Name, phone, address, city, state, and zip code are required",
      });
    }

    // Check if salesman exists
    const salesman = await Salesman.findById(salesmanId);
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    // Check if phone number is already in use
    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      return res.status(400).json({
        message: "Phone number is already registered to another client",
      });
    }

    // Create the client
    const client = new Client({
      name,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      notes,
      salesman: salesmanId,
    });

    // Save the client
    await client.save();

    // Return the client
    res.status(201).json({
      message: "Client created successfully",
      client,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all clients
const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get clients by salesman ID
const getClientsBySalesman = async (req, res) => {
  try {
    const { salesmanId } = req.params;

    // Check if salesman exists
    const salesman = await Salesman.findById(salesmanId);
    if (!salesman) {
      return res.status(404).json({ message: "Salesman not found" });
    }

    const clients = await Client.find({ salesman: salesmanId });
    res.json(clients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get client by ID
const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update client
const updateClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Check if phone is being updated and is already in use by another client
    if (req.body.phone && req.body.phone !== client.phone) {
      const existingClient = await Client.findOne({ phone: req.body.phone });
      if (existingClient) {
        return res.status(400).json({
          message: "Phone number is already registered to another client",
        });
      }
    }

    // Update client fields
    Object.keys(req.body).forEach((key) => {
      client[key] = req.body[key];
    });

    await client.save();
    res.json({ message: "Client updated successfully", client });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete client
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    await client.remove();
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createClient,
  getAllClients,
  getClientsBySalesman,
  getClientById,
  updateClient,
  deleteClient,
};
