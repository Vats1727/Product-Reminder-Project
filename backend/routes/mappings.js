const express = require('express')
const router = express.Router()
const CustomerProductMap = require('../models/CustomerProductMap')
const Customer = require('../models/Customer')
const Product = require('../models/Product')

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