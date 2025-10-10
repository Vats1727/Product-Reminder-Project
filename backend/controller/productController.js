import Product from "../model/Product.js";
import User from "../model/User.js";
import { sendReminderEmail } from "../services/mailer.js";
import { emitReminder } from "../services/notifier.js";

// Keep references to timeouts so server restart clears them anyway
const testTimeouts = new Map();

export const createProduct = async (req, res) => {
  try {
    const { name, description, purchaseDate, expiryDate, reminderDaysBefore } = req.body;
    const userId = req.userId; // assume middleware sets this from JWT

    if (!name || !purchaseDate || !expiryDate) {
      return res.status(400).json({ message: "name, purchaseDate and expiryDate are required" });
    }

    const productData = {
      user: userId,
      name,
      description,
      purchaseDate: new Date(purchaseDate),
      expiryDate: new Date(expiryDate),
      reminderDaysBefore: reminderDaysBefore || 15,
    };

    // If TEST_REMINDER_MINUTES is set, schedule a quick test reminder
    const testMinutes = Number(process.env.TEST_REMINDER_MINUTES || 0);
    if (testMinutes > 0) {
      const now = new Date();
      productData.testReminderAt = new Date(now.getTime() + testMinutes * 60 * 1000);
    }

    const product = await Product.create(productData);

    // If we scheduled a test reminder, also set an in-memory timeout to trigger it
    if (product.testReminderAt) {
      const ms = new Date(product.testReminderAt).getTime() - Date.now();
      if (ms > 0) {
        const t = setTimeout(async () => {
          try {
            // reload product fresh
            const p = await Product.findById(product._id).populate('user');
            if (!p || !p.user) return;
            // only send if testReminderAt still set and due
            if (p.testReminderAt && new Date(p.testReminderAt) <= new Date()) {
              const info = await sendReminderEmail(p.user.email, p.user.fullName, p);
              p.lastReminderSent = new Date();
              p.testReminderAt = undefined;
              await p.save();
              emitReminder({ to: p.user.email, name: p.user.fullName, product: p.name, expiryDate: p.expiryDate, info });
            }
          } catch (err) { console.error('Test reminder timeout error', err); }
        }, ms);
        testTimeouts.set(String(product._id), t);
      }
    }

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

      // If a test reminder is scheduled and due, send it
      if (p.testReminderAt) {
        const due = new Date(p.testReminderAt) <= now;
        const alreadySentTest = p.lastReminderSent && p.lastReminderSent >= p.testReminderAt;
        if (due && !alreadySentTest) {
          const info = await sendReminderEmail(p.user.email, p.user.fullName, p);
          p.lastReminderSent = now;
          // clear testReminderAt so it doesn't repeat
          p.testReminderAt = undefined;
          await p.save();
          emitReminder({ to: p.user.email, name: p.user.fullName, product: p.name, expiryDate: p.expiryDate, info });
          continue; // move to next product
        }
      }

      const msBefore = p.reminderDaysBefore * 24 * 60 * 60 * 1000;
      const reminderDate = new Date(p.expiryDate.getTime() - msBefore);

      // send if today is >= reminderDate and we haven't sent after reminderDate
      const alreadySent = p.lastReminderSent && p.lastReminderSent >= reminderDate;
      // compare only date portion
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const remDay = new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());

      if (today >= remDay && !alreadySent) {
        // send email
        const info = await sendReminderEmail(p.user.email, p.user.fullName, p);
        p.lastReminderSent = now;
        await p.save();
        // emit realtime notification
        emitReminder({ to: p.user.email, name: p.user.fullName, product: p.name, expiryDate: p.expiryDate, info });
      }
    }
  } catch (err) {
    console.error("Reminder check failed:", err);
  }
};
