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
  }
})

module.exports = mongoose.model('CustomerProductMap', customerProductMapSchema)