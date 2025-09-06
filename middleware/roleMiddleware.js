// middleware/roleMiddleware.js
// usage: authorize("Admin"), authorize("Admin","Manager")
exports.authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  const role = req.user.role;
  if (allowedRoles.includes(role)) return next();
  return res.status(403).json({ error: "Forbidden: insufficient role" });
};
