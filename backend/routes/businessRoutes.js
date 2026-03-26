import express from "express";
import { updateBusinessProfile } from "../controllers/businessController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.put("/update-profile", verifyToken, updateBusinessProfile);

export default router;
