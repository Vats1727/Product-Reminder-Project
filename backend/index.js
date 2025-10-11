import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import { checkAndSendReminders } from "./controller/productController.js";
import cron from "node-cron";

dotenv.config();

// Connect to MongoDB Atlas
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Setup Socket.IO
const io = new SocketIOServer(server, {
	cors: { origin: process.env.CLIENT_ORIGIN || "*" },
});

io.on("connection", (socket) => {
	console.log("Socket connected:", socket.id);
	socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

setIo(io);

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Schedule reminder checks once a day at 08:00 server time
// Reminder scheduler removed. Use manual trigger or scripts to inspect candidates.
