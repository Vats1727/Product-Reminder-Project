const express = require('express')
const router = express.Router()
const CustomerProductMap = require('../models/CustomerProductMap')

function addPeriod(date, count, period) {
  const d = new Date(date)
  if (!count) count = 1
  switch ((period || 'Months').toLowerCase()) {
    case 'days': d.setDate(d.getDate() + count); break
  case 'months': d.setMonth(d.getMonth() + count); break
  case 'years': d.setFullYear(d.getFullYear() + count); break
    default: d.setMonth(d.getMonth() + count); break
  }
  return d
}

// GET /api/reminders?days=30&customerId=&type=&source=
router.get('/', async (req, res) => {
  try {
    const days = Number(req.query.days) || 30
    const customerId = req.query.customerId || null
    const type = req.query.type || null
    const source = req.query.source || null

    const all = await CustomerProductMap.find()
      .populate('customerId')
      .populate('productId')

    const now = new Date()
    const horizon = new Date()
    horizon.setDate(horizon.getDate() + days)

    const reminders = []
    for (const m of all) {
      if (customerId && String(m.customerId._id) !== String(customerId)) continue
      const p = m.productId
      if (!p) continue
      if (type && p.type !== type) continue
      if (source && p.source !== source) continue

      // determine start date: prefer product.datePurchased, fallback to mapping.dateAssigned
      const start = m.dateAssigned ? new Date(m.dateAssigned) : (p.datePurchased ? new Date(p.datePurchased) : null)
      if (!start) continue

      let expiry
      if (p.type === 'One-time') {
        expiry = start
      } else {
        // recurring: add count * period to start
        expiry = addPeriod(start, p.count || 1, p.period)
      }

      // include if expiry between now and horizon (inclusive)
      if (expiry >= now && expiry <= horizon) {
        reminders.push({ mapping: m, customer: m.customerId, product: p, expiry })
      }
    }

    res.json({ days, count: reminders.length, reminders })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to compute reminders' })
  }
})

module.exports = router
