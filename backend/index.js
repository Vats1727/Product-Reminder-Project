import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { checkAndSendReminders } from "./controller/productController.js";
import cron from "node-cron";
import { setIo } from "./services/notifier.js";

dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Schedule reminder checks once a day at 08:00 server time
// Reminder scheduler removed. Use manual trigger or scripts to inspect candidates.
