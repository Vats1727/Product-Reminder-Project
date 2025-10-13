const express = require('express')
const router = express.Router()
const Customer = require('../models/Customer')
const Product = require('../models/Product')

// Create customer
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body
    const c = new Customer({ name, email, phone })
    await c.save()
    res.status(201).json(c)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// List customers (with products)
router.get('/', async (req, res) => {
  try {
    const list = await Customer.find().populate('products')
    res.json(list)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// Link a product to a customer
router.post('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params
    const customer = await Customer.findById(id)
    const product = await Product.findById(productId)
    if (!customer || !product) return res.status(404).json({ error: 'Not found' })
    if (!customer.products.includes(product._id)) customer.products.push(product._id)
    if (!product.customers.includes(customer._id)) product.customers.push(customer._id)
    await customer.save()
    await product.save()
    res.json({ customer, product })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to link' })
  }
})

// Unlink product
router.delete('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params
    const customer = await Customer.findById(id)
    const product = await Product.findById(productId)
    if (!customer || !product) return res.status(404).json({ error: 'Not found' })
    customer.products = customer.products.filter(p => p.toString() !== productId)
    product.customers = product.customers.filter(c => c.toString() !== id)
    await customer.save()
    await product.save()
    res.json({ customer, product })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to unlink' })
  }
})

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body
    const c = await Customer.findById(req.params.id)
    if (!c) return res.status(404).json({ error: 'Not found' })
    if (name !== undefined) c.name = name
    if (email !== undefined) c.email = email
    if (phone !== undefined) c.phone = phone
    await c.save()
    const populated = await Customer.findById(c._id).populate('products')
    res.json(populated)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
})

// Delete customer and unlink from products
router.delete('/:id', async (req, res) => {
  try {
    const c = await Customer.findById(req.params.id)
    if (!c) return res.status(404).json({ error: 'Not found' })
    // remove this customer from any products
    await Product.updateMany({ _id: { $in: c.products } }, { $pull: { customers: c._id } })
    await c.remove()
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete' })
  }
})

module.exports = router
