require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI

if (!MONGO_URI) {
	console.error('MONGO_URI not set in .env')
	process.exit(1)
}

mongoose.connect(MONGO_URI, { dbName: 'product_reminder' })
	.then(() => console.log('Mongo connected'))
	.catch(err => {
		console.error('Mongo connection error', err)
		process.exit(1)
	})

// Routes
app.get('/health', (req, res) => res.json({ ok: true }))

const customersRouter = require('./routes/customers')
const productsRouter = require('./routes/products')
const remindersRouter = require('./routes/reminders')
const mappingsRouter = require('./routes/mappings')

app.use('/api/customers', customersRouter)
app.use('/api/products', productsRouter)
app.use('/api/reminders', remindersRouter)
app.use('/api/mappings', mappingsRouter)

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))

