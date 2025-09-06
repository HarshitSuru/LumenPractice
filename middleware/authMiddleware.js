// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "No token provided" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // minimal payload: { id, role }
    const user = await User.findById(payload.id).select("-password");
    if (!user) return res.status(401).json({ error: "Invalid token user" });

    req.user = user; // attach to request
    next();
  } catch (err) {
    return res.status(401).json({ error: "Authentication failed", details: err.message });
  }
};
