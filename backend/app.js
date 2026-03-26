import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import cors from "cors";

// Route Imports
import authRoutes from "./routes/auth.js";
import employeeRoutes from "./routes/employees.js";
import inventoryRoutes from "./routes/inventory.js";
import transactionRoutes from "./routes/transactions.js";
import businessRoutes from "./routes/businessRoutes.js";

// Configuration
dotenv.config();
const app = express();

// Middlewares
app.use(cors()); // Allows your React app to talk to this server
app.use(
  cors({
    origin: ["https://your-frontend-name.vercel.app", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(morgan("dev")); // Logs requests to the terminal
app.use(express.json()); // Essential for parsing JSON bodies from React
app.use(express.json());

// 2. For Postman "x-www-form-urlencoded" (What you used)
app.use(express.urlencoded({ extended: true }));
// Routes
// We prefix with /api to keep things organized
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/business", businessRoutes);
// Health Check (Optional - helpful for Render deployment)
app.get("/", (req, res) => {
  res.send("Inventory Management API is running...");
});

// Server Listen
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
