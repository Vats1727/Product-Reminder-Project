import Product from "../model/Product.js";
import User from "../model/User.js";
import { sendReminderEmail } from "../services/mailer.js";

export const createProduct = async (req, res) => {
  try {
    const { name, description, purchaseDate, expiryDate, reminderDaysBefore } = req.body;
    const userId = req.userId; // assume middleware sets this from JWT

    if (!name || !purchaseDate || !expiryDate) {
      return res.status(400).json({ message: "name, purchaseDate and expiryDate are required" });
    }

    const product = await Product.create({
      user: userId,
      name,
      description,
      purchaseDate: new Date(purchaseDate),
      expiryDate: new Date(expiryDate),
      reminderDaysBefore: reminderDaysBefore || 15,
    });

    res.status(201).json({ message: "Product created", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const listProducts = async (req, res) => {
  try {
    const userId = req.userId;
    const products = await Product.find({ user: userId });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// This function is intended to be called by a scheduler to send reminders
export const checkAndSendReminders = async () => {
  try {
    const now = new Date();
    // find products where reminder window includes today and we haven't sent a reminder yet today
    const products = await Product.find({}).populate("user");

    for (const p of products) {
      if (!p.user || !p.user.email) continue;

      const msBefore = p.reminderDaysBefore * 24 * 60 * 60 * 1000;
      const reminderDate = new Date(p.expiryDate.getTime() - msBefore);

      // send if today is >= reminderDate and we haven't sent after reminderDate
      const alreadySent = p.lastReminderSent && p.lastReminderSent >= reminderDate;
      // compare only date portion
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const remDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

      if (today >= remDay && !alreadySent) {
        // send email
        await sendReminderEmail(p.user.email, p.user.fullName, p);
        p.lastReminderSent = now;
        await p.save();
      }
    }
  } catch (err) {
    console.error("Reminder check failed:", err);
  }
};
