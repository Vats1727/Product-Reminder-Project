const mongoose = require('mongoose')

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, validate: { validator: v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), message: props => `${props.value} is not a valid email` } },
  phone: { type: String, validate: { validator: v => !v || /^\+?[0-9\s\-]{7,20}$/.test(v) && v.replace(/\D/g, '').length <= 10, message: props => `Phone must be at most 10 digits` } },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true })

module.exports = mongoose.model('Customer', CustomerSchema)
