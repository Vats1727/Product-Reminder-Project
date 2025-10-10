import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  description: { type: String },
  purchaseDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  // how many days before expiry the user wants the reminder (default 15)
  reminderDaysBefore: { type: Number, default: 15 },
  // last reminder sent date (helps avoid duplicate reminders)
  lastReminderSent: { type: Date },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
