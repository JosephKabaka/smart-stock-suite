import express from "express";
const router = express.Router();
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  addProduction,
  getStockLevels, // You'll need this to replace renderDashboard
} from "../controllers/inventoryController.js";

// @route   GET /api/inventory
// @desc    Get all stock levels for the specific business
router.get("/", verifyToken, getStockLevels);

// @route   POST /api/inventory/add
// @desc    Add new production/stock (Admin Only)
router.post("/add", verifyToken, isAdmin, addProduction);

export default router;
