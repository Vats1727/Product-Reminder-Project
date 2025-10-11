import User from "../model/User.js";
import Product from "../model/Product.js";
import { sendReminderEmail } from "../services/mailer.js";
import { emitReminder } from "../services/notifier.js";

// List all users with basic info and their products count
export const listUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').lean();
    // attach product counts
    const usersWithCounts = await Promise.all(users.map(async (u) => {
      const count = await Product.countDocuments({ user: u._id });
      return { ...u, productCount: count };
    }));
    res.json(usersWithCounts);
  } catch (err) {
    console.error('listUsers error', err);
    res.status(500).json({ message: err.message });
  }
};

// List all products with user info and calculate due status
export const listAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate('user', '-password').lean();
    const now = new Date();
    const out = products.map(p => {
      const msBefore = (p.reminderDaysBefore || 0) * 24 * 60 * 60 * 1000;
      const reminderDate = new Date(new Date(p.expiryDate).getTime() - msBefore);
      const daysUntilExpiry = Math.ceil((new Date(p.expiryDate) - now) / (24*60*60*1000));
      const due = now >= new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
      return {
        _id: p._id,
        name: p.name,
        price: p.price,
        expiryDate: p.expiryDate,
        reminderDaysBefore: p.reminderDaysBefore,
        user: p.user ? { _id: p.user._id, fullName: p.user.fullName, email: p.user.email } : null,
        daysUntilExpiry,
        due
      };
    });
    res.json(out);
  } catch (err) {
    console.error('listAllProducts error', err);
    res.status(500).json({ message: err.message });
  }
};

// Send reminder for a specific product (admin action)
export const sendProductReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Product.findById(id).populate('user');
    if (!p) return res.status(404).json({ message: 'Product not found' });
    if (!p.user || !p.user.email) return res.status(400).json({ message: 'Product has no user email' });

    const info = await sendReminderEmail(p.user.email, p.user.fullName, p);
    p.lastReminderSent = new Date();
    await p.save();
    emitReminder({ to: p.user.email, name: p.user.fullName, product: p.name, expiryDate: p.expiryDate, info });
    res.json({ message: 'Reminder sent', info });
  } catch (err) {
    console.error('sendProductReminder error', err);
    res.status(500).json({ message: err.message });
  }
};

// Delete a product as admin (bypass ownership)
export const deleteProductAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const p = await Product.findById(id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    await p.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('deleteProductAdmin error', err);
    res.status(500).json({ message: err.message });
  }
};
