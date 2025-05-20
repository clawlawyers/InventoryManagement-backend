const Manager = require("../models/Manager");
const Salesman = require("../models/Salesman");
const jwt = require("jsonwebtoken");

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === "manager") {
      const manager = await Manager.findById(decoded.id).populate("companies");
      if (!manager) {
        return res.status(401).json({ message: "Token is invalid" });
      }
      req.user = { user: manager, type: "manager" };
      return next(); // ✅ return here
    } else if (decoded.type === "salesman") {
      const salesman = await Salesman.findById(decoded.id);
      if (!salesman) {
        return res.status(401).json({ message: "Token is invalid" });
      }
      req.user = { user: salesman, type: "salesman" };
      return next(); // ✅ return here
    }

    // If token type is neither manager nor salesman
    return res.status(401).json({ message: "Token type is invalid" });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = { requireAuth };
