const express = require('express')
const router = express.Router()
const CustomerProductMap = require('../models/CustomerProductMap')
const Customer = require('../models/Customer')
const Product = require('../models/Product')

// Edit a subscription entry in a mapping
router.put('/:id/subscription/:subIdx', async (req, res) => {
  try {
    const mapping = await CustomerProductMap.findById(req.params.id)
    if (!mapping) return res.status(404).json({ error: 'Mapping not found' })
    const idx = Number(req.params.subIdx)
    if (!mapping.subscriptions || idx < 0 || idx >= mapping.subscriptions.length) return res.status(404).json({ error: 'Subscription not found' })
    const { amount, units, unitType } = req.body
    if (amount !== undefined) mapping.subscriptions[idx].amount = amount
    if (units !== undefined) mapping.subscriptions[idx].units = units
    if (unitType !== undefined) mapping.subscriptions[idx].unitType = unitType
    // Recalculate expiry if units/unitType changed
    if (units !== undefined || unitType !== undefined) {
      let start = idx === 0 ? (mapping.dateAssigned ? new Date(mapping.dateAssigned) : new Date()) : new Date(mapping.subscriptions[idx-1].expiresAt)
      let expiresAt = new Date(start)
      const n = Number(mapping.subscriptions[idx].units) || 0
      if (mapping.subscriptions[idx].unitType === 'Days') expiresAt.setDate(expiresAt.getDate() + n)
      else if (mapping.subscriptions[idx].unitType === 'Months') expiresAt.setMonth(expiresAt.getMonth() + n)
      else if (mapping.subscriptions[idx].unitType === 'Years') expiresAt.setFullYear(expiresAt.getFullYear() + n)
      mapping.subscriptions[idx].datePaid = start
      mapping.subscriptions[idx].expiresAt = expiresAt
    }
    await mapping.save()
    const populated = await CustomerProductMap.findById(mapping._id).populate('customerId').populate('productId')
    res.json(populated)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// Delete a subscription entry in a mapping
router.delete('/:id/subscription/:subIdx', async (req, res) => {
  try {
    const mapping = await CustomerProductMap.findById(req.params.id)
    if (!mapping) return res.status(404).json({ error: 'Mapping not found' })
    const idx = Number(req.params.subIdx)
    if (!mapping.subscriptions || idx < 0 || idx >= mapping.subscriptions.length) return res.status(404).json({ error: 'Subscription not found' })
    mapping.subscriptions.splice(idx, 1)
    // Recalculate ordinals and expiry dates for all subscriptions
    for (let i = 0; i < mapping.subscriptions.length; ++i) {
      mapping.subscriptions[i].ordinal = i + 1
      let start = i === 0 ? (mapping.dateAssigned ? new Date(mapping.dateAssigned) : new Date()) : new Date(mapping.subscriptions[i-1].expiresAt)
      let expiresAt = new Date(start)
      const n = Number(mapping.subscriptions[i].units) || 0
      if (mapping.subscriptions[i].unitType === 'Days') expiresAt.setDate(expiresAt.getDate() + n)
      else if (mapping.subscriptions[i].unitType === 'Months') expiresAt.setMonth(expiresAt.getMonth() + n)
      else if (mapping.subscriptions[i].unitType === 'Years') expiresAt.setFullYear(expiresAt.getFullYear() + n)
      mapping.subscriptions[i].datePaid = start
      mapping.subscriptions[i].expiresAt = expiresAt
    }
    await mapping.save()
    const populated = await CustomerProductMap.findById(mapping._id).populate('customerId').populate('productId')
    res.json(populated)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})


// Get all mappings with customer and product details
router.get('/', async (req, res) => {
  try {
    const mappings = await CustomerProductMap.find()
      .populate('customerId')
      .populate('productId')
    res.json(mappings)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch mappings' })
  }
})

// Create a new mapping
router.post('/', async (req, res) => {
  try {
    const { customerId, productId, remarks, dateAssigned } = req.body
    
    // Verify customer and product exist
    const customer = await Customer.findById(customerId)
    const product = await Product.findById(productId)
    
    if (!customer || !product) {
      return res.status(404).json({ error: 'Customer or Product not found' })
    }

    // Check if mapping already exists
    const existingMapping = await CustomerProductMap.findOne({ customerId, productId })
    if (existingMapping) {
      return res.status(400).json({ error: 'Mapping already exists' })
    }

  const mapping = new CustomerProductMap({ customerId, productId, remarks, dateAssigned: dateAssigned ? new Date(dateAssigned) : undefined })
    await mapping.save()

    // Add product to customer's products array
    // Add product to customer's products array (use $addToSet to avoid running validators on document save)
    await Customer.updateOne({ _id: customerId }, { $addToSet: { products: productId } })

    // Add customer to product's customers array (use $addToSet to avoid running validators on document save)
    await Product.updateOne({ _id: productId }, { $addToSet: { customers: customerId } })

    const populatedMapping = await CustomerProductMap.findById(mapping._id)
      .populate('customerId')
      .populate('productId')

    res.status(201).json(populatedMapping)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// Update mapping (remarks and/or dateAssigned)
router.put('/:id', async (req, res) => {
  try {
    const { remarks, dateAssigned } = req.body
    const mapping = await CustomerProductMap.findById(req.params.id)
    if (!mapping) {
      return res.status(404).json({ error: 'Mapping not found' })
    }
    
    if (remarks !== undefined) mapping.remarks = remarks
    if (dateAssigned !== undefined) mapping.dateAssigned = dateAssigned ? new Date(dateAssigned) : undefined
    await mapping.save()
    
    const populatedMapping = await CustomerProductMap.findById(mapping._id)
      .populate('customerId')
      .populate('productId')
    
    res.json(populatedMapping)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// Record a payment / subscription for a mapping
router.post('/:id/pay', async (req, res) => {
  try {
    const { units = 1, unitType = 'Months', amount, datePaid } = req.body
    const mapping = await CustomerProductMap.findById(req.params.id)
    if (!mapping) return res.status(404).json({ error: 'Mapping not found' })
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Subscription amount must be greater than 0' })

    // Determine ordinal
    const ordinal = (mapping.subscriptions?.length || 0) + 1

    // Compute purchase/expiry dates
    // If this is the first subscription or there is a gap, use provided datePaid or today
    let purchaseDate = datePaid ? new Date(datePaid) : new Date()
    if (mapping.subscriptions && mapping.subscriptions.length) {
      const lastExpiry = new Date(mapping.subscriptions[mapping.subscriptions.length - 1].expiresAt)
      // If new purchaseDate is after lastExpiry, treat as fresh cycle (gap)
      // If new purchaseDate is before or equal to lastExpiry, chain from last expiry
      if (purchaseDate.getTime() <= lastExpiry.getTime()) {
        purchaseDate = new Date(lastExpiry)
      }
      // else, use purchaseDate as selected (gap)
    } else {
      // First subscription, use mapping.dateAssigned or today
      purchaseDate = mapping.dateAssigned ? new Date(mapping.dateAssigned) : purchaseDate
    }
    const expiresAt = new Date(purchaseDate)

    // Add units based on unitType
    const n = Number(units) || 0
    if (unitType === 'Days') {
      expiresAt.setDate(expiresAt.getDate() + n)
    } else if (unitType === 'Months') {
      expiresAt.setMonth(expiresAt.getMonth() + n)
    } else if (unitType === 'Years') {
      expiresAt.setFullYear(expiresAt.getFullYear() + n)
    }

    const sub = { amount, units: Number(units), unitType, datePaid: purchaseDate, expiresAt, ordinal }
    mapping.subscriptions = mapping.subscriptions || []
    mapping.subscriptions.push(sub)
    await mapping.save()

    const populated = await CustomerProductMap.findById(mapping._id).populate('customerId').populate('productId')
    res.json(populated)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// Update product details for a specific mapping
router.put('/:id/details', async (req, res) => {
  try {
    const mapping = await CustomerProductMap.findById(req.params.id);
    if (!mapping) {
      return res.status(404).json({ error: 'Mapping not found' });
    }

    // Update the product detail fields
    const updateFields = {};
    ['amount', 'type', 'source', 'count', 'period'].forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    const updatedMapping = await CustomerProductMap.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).populate('customerId')
      .populate('productId');

    res.json(updatedMapping);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Delete mapping
router.delete('/:id', async (req, res) => {
  try {
    const mapping = await CustomerProductMap.findById(req.params.id)
    if (!mapping) {
      return res.status(404).json({ error: 'Mapping not found' })
    }

    // Remove product from customer's products array
    await Customer.updateOne(
      { _id: mapping.customerId },
      { $pull: { products: mapping.productId } }
    )

    // Remove customer from product's customers array
    await Product.updateOne(
      { _id: mapping.productId },
      { $pull: { customers: mapping.customerId } }
    )

    await CustomerProductMap.deleteOne({ _id: mapping._id })
    res.json({ success: true, id: mapping._id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete mapping' })
  }
})

module.exports = router