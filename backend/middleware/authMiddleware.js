import jwt from "jsonwebtoken";

/**
 * verifyToken - The Gatekeeper
 * Protects routes and extracts user data from the JWT
 */
export const verifyToken = (req, res, next) => {
  // Get token from the header (format: "Bearer <token>")
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    // Verify token using your secret key from .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user data to the request object
    req.user = decoded;

    next(); // Move to the controller
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid or has expired" });
  }
};

/**
 * isAdmin - The Role Checker
 * Ensures only users with the 'admin' role can perform certain actions
 */
export const isAdmin = (req, res, next) => {
  // verifyToken runs before this, so req.user already exists
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      msg: "Access denied. You do not have permission to perform this action.",
    });
  }
  next();
};
