import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db.js';
import User from '../model/User.js';
import Product from '../model/Product.js';

const emailArg = process.argv[2] || 'testuser@example.com';
const productName = process.argv[3] || 'Frontend Test Product';

(async () => {
  try {
    await connectDB();

    // find or create user
    let user = await User.findOne({ email: emailArg });
    if (!user) {
      user = await User.create({ fullName: 'Test User', email: emailArg, phone: '9999999999', password: 'test1234' });
      console.log('Created user:', emailArg);
    } else {
      console.log('Found user:', emailArg);
    }

    // create product such that reminderDate == today
    const reminderDaysBefore = 0; // so reminderDate == expiryDate
    const today = new Date();
    const expiryDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const product = await Product.create({
      user: user._id,
      name: productName,
      description: 'Created for frontend one-minute test',
      purchaseDate: today,
      expiryDate,
      reminderDaysBefore,
    });

    console.log('Created product id:', product._id.toString(), 'expiryDate:', expiryDate.toISOString());
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
