const Client = require("../models/Client");
const Salesman = require("../models/Salesman");
const Manager = require("../models/Manager");

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
    const { user, type } = req.user;

    let clients;
    if (type === "manager") {
      // For managers, show all clients associated with them
      clients = await Client.find({ manager: user._id });
    } else if (type === "salesman") {
      // For salesmen, show only their assigned clients
      clients = await Client.find({ salesman: user._id });
    } else {
      return res.status(403).json({
        message: "Unauthorized: Only managers and salesmen can view clients",
      });
    }

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
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json({ message: "Client deleted successfully", client });
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create a new client (can be done by both manager and salesman)
const createClientByManagerOrSalesman = async (req, res) => {
  try {
    const { name, phone, firmName, firmGSTNumber, email, address, salesmanId } =
      req.body;

    // Get user information from the authentication middleware
    // For testing without auth, provide default values
    const { user, type } = req.user || {
      user: { _id: "test-manager-id", name: "Test Manager" },
      type: "manager",
    };

    // Validate required fields
    if (!name || !phone || !address) {
      return res.status(400).json({
        message: "Name, phone, and address are required",
      });
    }

    // Check if phone number is already in use
    const existingClient = await Client.findOne({ phone });
    if (existingClient) {
      return res.status(400).json({
        message: "Phone number is already registered to another client",
      });
    }

    let assignedSalesmanId = null;
    let managerId = null;

    // Handle salesman assignment based on user type
    if (type === "manager") {
      // If manager is creating the client, they can optionally assign a salesman
      managerId = user._id; // Set manager ID directly from user

      if (salesmanId) {
        // Verify that the salesman exists and belongs to this manager
        const salesman = await Salesman.findById(salesmanId);
        if (!salesman) {
          return res.status(404).json({ message: "Salesman not found" });
        }

        // Check if the salesman belongs to this manager
        if (salesman.manager.toString() !== user._id.toString()) {
          return res.status(403).json({
            message: "You can only assign clients to your own salesmen",
          });
        }

        assignedSalesmanId = salesmanId;
      }
      // If no salesmanId provided, client will be created without a salesman assignment
    } else if (type === "salesman") {
      // If salesman is creating the client, assign it to themselves
      assignedSalesmanId = user._id;

      // Get manager ID from salesman record
      const salesman = await Salesman.findById(user._id);
      if (!salesman) {
        return res.status(404).json({ message: "Salesman not found" });
      }
      managerId = salesman.manager;
    } else {
      return res.status(403).json({
        message: "Only managers and salesmen can create clients",
      });
    }

    // Create the client
    const clientData = {
      name,
      phone,
      address,
      manager: managerId, // Add manager field to client data
    };

    // Add optional fields if provided
    if (firmName) clientData.firmName = firmName;
    if (firmGSTNumber) clientData.firmGSTNumber = firmGSTNumber;
    if (email) clientData.email = email;
    if (assignedSalesmanId) clientData.salesman = assignedSalesmanId;

    const client = new Client(clientData);

    // Save the client
    await client.save();

    // Populate the salesman information if assigned
    await client.populate("salesman", "name user_id phone");

    // Return the client
    res.status(201).json({
      message: "Client created successfully",
      client,
      createdBy: {
        id: user._id,
        name: user.name,
        type: type,
      },
    });
  } catch (err) {
    console.error("Error creating client:", err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createClient,
  createClientByManagerOrSalesman,
  getAllClients,
  getClientsBySalesman,
  getClientById,
  updateClient,
  deleteClient,
};
