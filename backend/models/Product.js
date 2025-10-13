const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['One-time', 'Recurring'], default: 'One-time' },
  count: { type: Number, default: 1 },
  period: { type: String, default: 'Months' },
  source: { type: String, default: 'In-house' },
  datePurchased: { type: Date },
  customers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }]
}, { timestamps: true })

module.exports = mongoose.model('Product', ProductSchema)
