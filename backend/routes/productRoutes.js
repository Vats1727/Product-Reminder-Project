import express from "express";
import { createProduct, listProducts, checkAndSendReminders } from "../controller/productController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// create and list products
router.post("/", authMiddleware, createProduct);
router.get("/", authMiddleware, listProducts);

// get due reminders for current user
router.get("/due", authMiddleware, async (req, res) => {
  try {
    const { getDueReminders } = await import("../controller/productController.js");
    return getDueReminders(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// manual trigger for reminders (protected or internal)
router.post("/trigger-reminders", async (req, res) => {
  try {
  await checkAndSendReminders();
  res.json({ message: "Reminder check completed (email sending disabled)" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
