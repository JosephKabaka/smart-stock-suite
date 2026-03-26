import express from "express";
const router = express.Router();
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  getEmployeesPerformance,
  addEmployee,
  toggleEmployeeStatus,
} from "../controllers/employeeController.js";

// All users can see performance
router.get("/performance", verifyToken, getEmployeesPerformance);

// Only admins can add or toggle status
router.post("/add", verifyToken, isAdmin, addEmployee);
router.patch("/toggle/:id", verifyToken, isAdmin, toggleEmployeeStatus);

export default router;
