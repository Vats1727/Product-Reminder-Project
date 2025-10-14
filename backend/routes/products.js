const express = require('express')
const router = express.Router()
const Product = require('../models/Product')
const Customer = require('../models/Customer')

// Create product
router.post('/', async (req, res) => {
  try {
    const { productName, amount, type, count, period, source, customerId, datePurchased } = req.body
    const p = new Product({ productName, amount, type, count, period, source, datePurchased })
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
    const id = req.params.id
    console.log(`[products:DELETE] request to delete product id=${id}`)
    const p = await Product.findById(id)
    if (!p) {
      console.log(`[products:DELETE] product not found id=${id}`)
      return res.status(404).json({ error: 'Not found' })
    }
    // remove from customers
    await Customer.updateMany({ _id: { $in: p.customers } }, { $pull: { products: p._id } })
    await Product.deleteOne({ _id: id })
    console.log(`[products:DELETE] deleted product id=${id}`)
    res.json({ success: true, id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

// Update product and optionally change linked customer
router.put('/:id', async (req, res) => {
  try {
    const { productName, amount, type, count, period, source, customerId, datePurchased } = req.body
    const p = await Product.findById(req.params.id)
    if (!p) return res.status(404).json({ error: 'Not found' })

    // Update basic fields
    if (productName !== undefined) p.productName = productName
    if (amount !== undefined) p.amount = amount
    if (type !== undefined) p.type = type
    if (count !== undefined) p.count = count
    if (period !== undefined) p.period = period
    if (source !== undefined) p.source = source
    if (datePurchased !== undefined) p.datePurchased = datePurchased

    // If customerId is provided, ensure linkage: remove from old customers and add to new
    if (customerId !== undefined) {
      const newCustId = customerId || null
      const oldCustomerIds = p.customers.map(id => id.toString())
      // if newCustId is not already present, set customers to [newCustId] (app treats product linked to single customer)
      if (newCustId) {
        p.customers = [newCustId]
      } else {
        p.customers = []
      }

      // remove product from any old customers that are no longer linked
      const toRemove = oldCustomerIds.filter(id => id !== (newCustId || ''))
      if (toRemove.length) {
        await Customer.updateMany({ _id: { $in: toRemove } }, { $pull: { products: p._id } })
      }

      // add product to the new customer if provided
      if (newCustId) {
        const c = await Customer.findById(newCustId)
        if (c && !c.products.includes(p._id)) {
          c.products.push(p._id)
          await c.save()
        }
      }
    }

    await p.save()
    const populated = await Product.findById(p._id).populate('customers')
    res.json(populated)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
