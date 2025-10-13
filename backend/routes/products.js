const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const Customer = require('../models/Customer')

// Create product
router.post('/', async (req, res) => {
  try {
    const { productName, amount, type, count, period, source, customerId } = req.body
    const p = new Product({ productName, amount, type, count, period, source })
    if (customerId) p.customers.push(customerId)
    await p.save()
    if (customerId) {
      const c = await Customer.findById(customerId)
      if (c && !c.products.includes(p._id)) {
        c.products.push(p._id)
        await c.save()
      }
    }
    res.status(201).json(p)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// List products (with customers)
router.get('/', async (req, res) => {
  try {
    const list = await Product.find().populate('customers')
    res.json(list)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
})

// Delete product and unlink from customers
router.delete('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id)
    if (!p) return res.status(404).json({ error: 'Not found' })
    // remove from customers
    await Customer.updateMany({ _id: { $in: p.customers } }, { $pull: { products: p._id } })
    await p.remove()
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

module.exports = router
