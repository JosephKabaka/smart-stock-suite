import express from "express";
const router = express.Router();
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";
import {
  dispatchWorker,
  settleWorker,
  renderStockLogs,
} from "../controllers/transactionsController.js";

// @route   GET /api/transactions/logs
// @desc    View history of all movements
router.get("/logs", verifyToken, renderStockLogs);

// @route   POST /api/transactions/dispatch
// @desc    Worker takes products out (Admin Only)
router.post("/dispatch", verifyToken, isAdmin, dispatchWorker);

// @route   POST /api/transactions/return
// @desc    Worker returns and settles payment (Admin Only)
router.post("/return", verifyToken, isAdmin, settleWorker);

export default router;
