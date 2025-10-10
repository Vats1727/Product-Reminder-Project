import express from "express";
import { createProduct, listProducts, checkAndSendReminders } from "../controller/productController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// create and list products
router.post("/", authMiddleware, createProduct);
router.get("/", authMiddleware, listProducts);

// manual trigger for reminders (protected or internal)
router.post("/trigger-reminders", async (req, res) => {
  try {
    await checkAndSendReminders();
    res.json({ message: "Reminder check triggered" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
