// import express from "express";

// const router = express.Router();

// import {
//   renderDashboard,
//   dispatchWorker,
//   addProduction,
//   settleWorker,
//   renderStockLogs,
//   getEmployeesPerformance,
//   addEmployee,
//   toggleEmployeeStatus,
// } from "../controllers/salesController.js";

// router.get("/", renderDashboard);
// router.post("/transactions/dispatch", dispatchWorker);
// router.post("/inventory/add", addProduction);
// router.post("/transactions/return", settleWorker);
// router.get("/logs", renderStockLogs);
// router.get("/employees/performance", getEmployeesPerformance);
// router.post("/employees/add", addEmployee);
// router.patch("/employees/toggle/:id", toggleEmployeeStatus);
// export default router;

import express from "express";
const router = express.Router();

// Import the specific route files
import authRoutes from "./auth.js";
import employeeRoutes from "./employees.js";
import inventoryRoutes from "./inventory.js";
import transactionRoutes from "./transactions.js";

// --- MAIN ROUTE MAPPING ---

// Auth (Login/Register)
router.use("/auth", authRoutes);

// Employees (Performance, Add, Toggle)
router.use("/employees", employeeRoutes);

// Inventory (Add Production, Stock levels)
router.use("/inventory", inventoryRoutes);

// Transactions (Dispatch, Settle/Return, Logs)
router.use("/transactions", transactionRoutes);

export default router;
