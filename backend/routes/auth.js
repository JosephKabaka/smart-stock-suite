import express from "express";
const router = express.Router();
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  login,
  registerBusiness,
  superadminLogin,
  changePassword,
} from "../controllers/authController.js";

// @route   POST /api/auth/register-business
// @desc    Register a new business and an admin manager
// @access  Private (In the future, you could protect this with a SuperAdmin key)
router.post("/register-business", registerBusiness);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (JWT)
// @access  Public
router.post("/login", login);
router.post("/superadmin/login", superadminLogin);
router.put("/changePassword", verifyToken, changePassword);
export default router;
