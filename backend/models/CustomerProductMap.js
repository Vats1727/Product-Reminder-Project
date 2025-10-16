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
  ,
  subscriptions: [{
    amount: { type: Number },
    units: { type: Number },
    unitType: { type: String, enum: ['Days', 'Months', 'Years'], default: 'Months' },
    datePaid: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    ordinal: { type: Number }
  }]
})

module.exports = mongoose.model('CustomerProductMap', customerProductMapSchema)