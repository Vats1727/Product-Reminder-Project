require('dotenv').config()
const mongoose = require('mongoose')
const Customer = require('./models/Customer')

async function run() {
  const MONGO_URI = process.env.MONGO_URI
  if (!MONGO_URI) {
    console.error('MONGO_URI not set in .env')
    process.exit(1)
  }

  try {
    await mongoose.connect(MONGO_URI, { dbName: 'product_reminder' })
    console.log('Mongo connected')

    const doc = new Customer({ name: 'Test User', email: `test_${Date.now()}@example.com`, phone: '+10000000000' })
    await doc.save()
    console.log('Inserted doc:', doc)
  } catch (err) {
    console.error('Error during test:', err)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

run()
