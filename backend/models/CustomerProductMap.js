const mongoose = require('mongoose')

const customerProductMapSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  remarks: {
    type: String,
    default: ''
  },
  dateAssigned: {
    type: Date,
    default: Date.now
  },
  // Product detail overrides
  amount: {
    type: Number
  },
  type: {
    type: String,
    enum: ['One-time', 'Recurring']
  },
  source: {
    type: String,
    enum: ['In-house', '3rd Party']
  },
  count: {
    type: Number
  },
  period: {
    type: String,
    enum: ['Days', 'Months', 'Years']
  }
})

module.exports = mongoose.model('CustomerProductMap', customerProductMapSchema)